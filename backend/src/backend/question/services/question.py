import asyncio
from collections.abc import Sequence
from pathlib import Path, PurePosixPath
from typing import Any, Literal
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import ColumnElement
from sqlmodel import Session, delete, select

from backend.core import logger
from backend.question.exceptions import (
    QuestionCreateError,
    QuestionDeleteError,
    QuestionNotFoundError,
    QuestionPathError,
    QuestionReadError,
    QuestionUpdateError,
    QuestionValidationError,
)
from backend.question.models import Question, QuestionType, Topic
from backend.question.schema import (
    QuestionCreate,
    QuestionFilter,
    QuestionRead,
    QuestionRelationships,
    QuestionUpdate,
    Status,
)
from backend.shared import ID
from backend.utils import convert_uuid
from backend.utils import database_generics as gdb

from .qtype import QuestionQTypeDB


class QuestionDB:
    def __init__(self, session: Session) -> None:
        """
        Initialize the question data access layer.

        Args:
            session: Active SQLModel session used for database operations.
        """
        self.session = session
        self._qtype = QuestionQTypeDB(self.session)
        self.metadata_rel = ["topics", "qType"]
        self.excluded_fields = self.metadata_rel

    async def create_question(
        self,
        question: QuestionCreate | dict,
    ) -> Question:
        """
        Create a question record and attach its relationships.

        Args:
            question: Question payload as a validated model or raw dict.
            created_by: Optional developer profile ID to store as the creator.

        Returns:
            The created Question ORM instance.
        """
        question = self.validate_data(question)

        question_orm = Question(
            **question.model_dump(exclude=set(self.excluded_fields)),
        )

        self.session.add(question_orm)
        question_orm = await self._attach_question_relationships(question_orm, question)
        self.session.add(question_orm)
        # persist to database
        try:
            self.session.commit()
            self.session.refresh(question_orm)
            return question_orm
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to create question")
            raise QuestionCreateError(f"Failed to create question: {e}") from e

    async def get_questions_by_creator(
        self, created_by_id: UUID | str
    ) -> Sequence[Question]:
        """
        Retrieve all questions created by a specific developer profile.

        Args:
            created_by_id: Developer profile identifier.

        Returns:
            A sequence of Question ORM instances owned by the creator.
        """
        try:
            return self.session.exec(
                select(Question).where(
                    Question.created_by_id == convert_uuid(created_by_id)
                )
            ).all()
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to retrieve questions by creator")
            raise QuestionReadError(
                f"Failed to retrieve questions for creator '{created_by_id}': {e}"
            ) from e

    async def get_question(self, qid: ID) -> Question | None:
        """
        Retrieve a question by its identifier.

        Args:
            qid: Question identifier.

        Returns:
            The matching Question ORM instance, or None if not found.
        """
        if qid is None:
            raise QuestionValidationError("Question id cannot be None.")

        try:
            question_id = convert_uuid(qid)
            return self.session.exec(
                select(Question).where(Question.id == question_id)
            ).first()
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to retrieve question")
            raise QuestionReadError(f"Failed to retrieve question '{qid}': {e}") from e

    async def get_all_questions(
        self,
        offset: int = 0,
        limit: int = 100,
        method: Literal["default", "full"] = "default",
    ) -> Sequence[Question | QuestionRead]:
        """
        Retrieve a paginated list of questions.

        Args:
            offset: Number of rows to skip.
            limit: Maximum number of rows to return.
            method: Return raw ORM models with ``default`` or expanded data with ``full``.

        Returns:
            A sequence of Question models or QuestionData models depending on ``method``.
        """
        try:
            all_questions = self.session.exec(
                select(Question).offset(offset).limit(limit)
            ).all()

            if method == "default":
                return all_questions
            if method == "full":
                return await asyncio.gather(
                    *[self.get_question_data(q.id) for q in all_questions]
                )
            raise QuestionValidationError(
                f"Unsupported get_all_questions method '{method}'."
            )
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to retrieve questions")
            raise QuestionReadError(f"Failed to retrieve questions: {e}") from e

    async def get_question_data(self, qid: ID) -> QuestionRead:
        """
        Retrieve a question and expand its relationship fields into QuestionData.

        Args:
            qid: Question identifier.

        Returns:
            A QuestionData representation of the stored question.
        """
        q = await self.get_question(qid)
        if not q:
            raise QuestionNotFoundError(f"Question '{qid}' was not found.")
        question_data = q.model_dump(exclude=set(self.metadata_rel))
        relationship_data = await self.get_question_relationship_data(q)

        payload = QuestionRead(**question_data, **relationship_data)
        
        return payload

    async def update_question(
        self,
        qid: ID,
        update: QuestionUpdate,
    ) -> QuestionRead:
        """
        Update a question and its relationship metadata.

        Args:
            qid: Question identifier.
            update: Partial or full question payload to apply.

        Returns:
            The updated question as QuestionData.
        """

        q = await self.get_question(qid)
        if not q:
            raise QuestionNotFoundError(f"Question '{qid}' was not found.")
        update_data = self._validate_update_data(update)
        q = await self._attach_question_relationships(q, update_data)

        try:
            for k, v in update_data.model_dump(
                exclude=set(self.metadata_rel),
                exclude_unset=True,
            ).items():
                setattr(q, k, v)

            self.session.commit()
            self.session.refresh(q)

            return await self.get_question_data(q.id)

        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to update question")
            raise QuestionUpdateError(f"Failed to update question '{qid}': {e}") from e

    async def delete_question(
        self,
        qid: ID,
    ) -> bool:
        """
        Delete a single question by identifier.

        Args:
            qid: Question identifier.

        Returns:
            True when the question was deleted, otherwise False if it was not found.
        """
        q = await self.get_question(qid)
        if q is None:
            logger.warning("[QuestionDB] Cannot delete question '%s'; not found.", qid)
            return False
        try:
            self.session.delete(q)
            self.session.commit()
            self.session.flush()
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to delete question")
            raise QuestionDeleteError(f"Failed to delete question '{qid}': {e}") from e

    async def delete_all_questions(self) -> bool:
        """
        Delete all stored questions.

        Returns:
            True when the delete operation completes successfully.
        """
        try:
            statement = delete(Question)
            self.session.exec(statement)
            self.session.commit()
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to delete all questions")
            raise QuestionDeleteError(f"Failed to delete all questions: {e}") from e

    async def filter_questions(
        self,
        filter: QuestionFilter,
        *,
        additional_filters: Sequence[ColumnElement[bool] | bool] | None = None,
    ) -> Sequence[QuestionRead]:

        stmt = select(Question)
        # Where to store all the filters
        filters = []

        title = filter.title
        status = filter.status

        if title:
            filters.append(func.lower(Question.title).like(f"%{title.lower()}%"))
        if status:
            filters.append(Question.status == Status(status))
        if additional_filters:
            filters.extend(additional_filters)

        try:
            statement = stmt.where(*filters)
            logger.debug("The stmt %s", statement)
            questions = self.session.exec(statement).all()
            return await asyncio.gather(
                *[self.get_question_data(q.id) for q in questions]
            )

        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to filter all questions")
            raise ValueError(f"Failed to filter  questions: {e}") from e

    # Setter and Getters
    async def get_question_path(self, id: ID) -> str | None:
        question = await self.get_question(id)
        if not question:
            raise QuestionNotFoundError(f"Question with {id} does not exist")
        return question.storage_path

    async def set_question_path(self, id: ID, path: Path | str):
        """
        Persist a question path for the requested storage backend.

        Args:
            id: Question identifier.
            storage_type: Storage backend selector, such as ``local`` or ``cloud``.
            path: Filesystem or storage path to persist.

        Returns:
            The updated Question ORM instance.
        """
        question = await self.get_question(id)
        if not question:
            raise QuestionNotFoundError(f"Question '{id}' was not found.")
        try:
            question.storage_path = PurePosixPath(path).as_posix().rstrip("/") + "/"
            self.session.add(question)
            self.session.commit()
            self.session.refresh(question)
            return question

        except SQLAlchemyError as e:
            self.session.rollback()
            logger.exception("[QuestionDB] Failed to update question path")
            raise QuestionPathError(
                f"Failed to update question path for '{id}': {e}"
            ) from e

    # Utils
    async def _attach_question_relationships(
    self, question: Question, data: QuestionRelationships | QuestionUpdate
) -> Question:
        """
        Attach topic and question-type relationships to a question.
        """
        if data.topics is not None:
            question.topics = await gdb.get_or_create_many(
                self.session,
                Topic,
                data.topics,
            )

        if data.qType is not None:
            qtypes = []
            for qtype in data.qType:
                existing = self._qtype.get_qtype_by_name(qtype)
                qtypes.append(existing)

            question.qType = qtypes

        return question

    async def get_question_relationship_data(self, q: Question) -> dict[str, Any]:
        """
        Read relationship names from a stored question.

        Args:
            q: Question ORM instance.

        Returns:
            A mapping containing topic, language, and question-type name lists.
        """
        # Get the topics,languages and qtypes
        topics = await gdb.get_relationship_data(q, "topics", mode="list")
        qtypes = await gdb.get_relationship_data(q, "qType", mode="list")
        return {"topics": topics, "qType": qtypes}

    def validate_data(self, question: QuestionCreate | dict) -> QuestionCreate:
        """
        Validate and normalize raw question input.

        Args:
            question: Question payload as a QuestionData model or raw dict.

        Returns:
            A validated QuestionData instance.
        """
        try:
            data = (
                question.model_dump(exclude_none=True)
                if isinstance(question, QuestionCreate)
                else question
            )
            question = QuestionCreate.model_validate(data)
            if question.id:
                logger.info("[QDB] Question ID is in data converting")
                question.id = convert_uuid(question.id)
            return question
        except ValidationError as e:
            raise QuestionValidationError(f"Question payload is invalid: {e}") from e

    def _validate_update_data(self, update: QuestionUpdate | dict) -> QuestionUpdate:
        """
        Validate and normalize raw question input.

        Args:
            question: Question payload as a QuestionData model or raw dict.

        Returns:
            A validated QuestionData instance.
        """
        try:
            data = (
                update.model_dump(exclude_none=True)
                if isinstance(update, QuestionUpdate)
                else update
            )
            return QuestionUpdate.model_validate(data)

        except ValidationError as e:
            raise QuestionValidationError(f"Question payload is invalid: {e}") from e
