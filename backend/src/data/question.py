import asyncio
from pathlib import Path
from typing import Any, Dict, Literal, Sequence
from pydantic import ValidationError
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import delete, select

from src.core import logger
from sqlmodel import Session
from src.data import generic as gdb
from src.model.question import (
    Language,
    Question,
    QuestionType,
    Topic,
)
from src.types import QuestionData
from src.utils import convert_uuid

from src.types import STORAGE_TYPE, ID


class QuestionDB:
    def __init__(self, session: Session):
        self.session = session
        self.metadata_rel = ["topics", "languages", "qtypes"]
        self.excluded_fields = self.metadata_rel
        self.relationship_map = {
            "topics": (Topic, "name"),
            "languages": (Language, "name"),
            "qtypes": (QuestionType, "name"),
        }

    async def create_question(self, question: QuestionData | dict) -> Question:
        question = self.validate_data(question)
        logger.info("This is the question %s", question)
        question_orm = Question(
            **question.model_dump(exclude=set(self.excluded_fields))
        )

        self.session.add(question_orm)
        question_orm = await self.attach_question_relationships(question_orm, question)
        self.session.add(question_orm)
        # persist to database
        try:
            self.session.commit()
            self.session.refresh(question_orm)
            return question_orm
        except SQLAlchemyError as e:
            self.session.rollback()
            error_msg = f"[DB] could not create question {e}"
            logger.error(error_msg)
            raise Exception(f"[DB] failed to create question an error occured {e}")

    async def get_question(self, qid: ID) -> Question | None:
        try:
            if qid is None:
                raise ValueError("[DB] Question ID cannot be None")
            question_id = convert_uuid(qid)
            return self.session.exec(
                select(Question).where(Question.id == question_id)
            ).first()
        except SQLAlchemyError as e:
            self.session.rollback()
            error_msg = f"[DB] could not get question {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)

    async def get_all_questions(
        self,
        offset: int = 0,
        limit: int = 100,
        method: Literal["default", "full"] = "default",
    ) -> Sequence[Question | QuestionData]:
        all_questions = self.session.exec(
            select(Question).offset(offset).limit(limit)
        ).all()
        try:
            if method == "default":
                return all_questions
            elif method == "full":
                return await asyncio.gather(
                    *[self.get_question_data(q.id) for q in all_questions]
                )
        except SQLAlchemyError as e:
            self.session.rollback()
            error_message = f"[DB] failed to retrieve all questions {e}"
            logger.error(error_message)
            raise ValueError(error_message)

    async def get_question_data(self, qid: ID) -> QuestionData:
        q = await self.get_question(qid)
        if not q:
            logger.info(" [DB] Question is None")
            raise ValueError(
                "Failed to retrieve question, question does not exist in DB"
            )
        question_data = q.model_dump(exclude=set(self.metadata_rel))
        relationship_data = await self.get_question_relationship_data(q)
        q = QuestionData(**question_data, **relationship_data)
        return q

    async def update_question(
        self,
        qid: ID,
        update: QuestionData | dict,
    ) -> QuestionData:
        q = await self.get_question(qid)
        if not q:
            raise ValueError("[DB] Question does not exist")

        update_data = self.validate_data(update)
        q = await self.attach_question_relationships(q, update_data)

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
            logger.exception("[DB] Failed to update question")
            raise

    async def filter_questions(self, data: QuestionData) -> Sequence[QuestionData]:
        filters = []
        stmt = select(Question)
        # Exclude the relationship fields first form the other conditions
        for key, values in data.model_dump(exclude=set(self.metadata_rel)).items():
            if not values:
                continue
            conds = []
            if key in self.metadata_rel:
                rel_model, lookup_name = self.relationship_map[key]
                if isinstance(values, list):
                    rel_conds = [
                        gdb.filter_conditional(rel_model, lookup_name, v)
                        for v in values
                    ]
                    conds.append(or_(*rel_conds))
                else:
                    conds.append(
                        gdb.filter_conditional(
                            rel_model,
                            lookup_name,
                            values,
                        )
                    )

            if isinstance(values, list):
                conds.append(
                    or_(*[gdb.filter_conditional(Question, key, v) for v in values])
                )
            else:
                conds.append(gdb.filter_conditional(Question, key, values))

            if conds:
                filters.append(or_(*conds))

        if filters:
            stmt = stmt.where(*filters)
        stmt = stmt.distinct()
        results = self.session.exec(stmt).all()
        return await asyncio.gather(*[self.get_question_data(r.id) for r in results])

    async def delete_question(
        self,
        qid: ID,
    ) -> bool:
        q = await self.get_question(qid)
        if q is None:
            logger.warning("[DB] cannot delete question, question is not found")
            return False
        try:
            self.session.delete(q)
            self.session.commit()
            self.session.flush()
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            error_msg = f"[DB] failed to delete question {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)

    async def delete_all_questions(self) -> bool:
        try:
            statement = delete(Question)
            self.session.exec(statement)
            self.session.commit()
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.error(f"[DB] failed to delete all questions {e}")
            raise ValueError(f"[DB] failed todelete all questions an error occured {e}")

    # Setter and Getters
    async def get_question_path(self, id: ID, STORAGE_TYPE: STORAGE_TYPE) -> str | None:
        question = await self.get_question(id)
        if not question:
            raise ValueError("Question not found")
        if STORAGE_TYPE == "cloud":
            path = question.blob_path
        elif STORAGE_TYPE == "local":
            path = question.local_path
        else:
            raise ValueError(f"Invalid storage type: {STORAGE_TYPE}")
        return path

    async def set_question_path(
        self, id: ID, STORAGE_TYPE: STORAGE_TYPE, path: Path | str
    ):
        question = await self.get_question(id)
        if not question:
            raise ValueError("Question not found")
        path_str = Path(path).as_posix()
        try:
            if STORAGE_TYPE == "cloud":
                question.blob_path = path_str
            elif STORAGE_TYPE == "local":
                question.local_path = path_str
            else:
                raise ValueError(f"Invalid storage type: {STORAGE_TYPE}")

            self.session.add(question)
            self.session.commit()
            self.session.refresh(question)
            return question

        except SQLAlchemyError as e:
            self.session.rollback()
            raise Exception(f"Failed to update question path: {e}")

    # Utils
    async def attach_question_relationships(
        self, question: Question, data: dict | QuestionData
    ) -> Question:
        data = self.validate_data(data)
        # Extract relationship meta
        topic_names = data.topics
        language_names = data.languages
        qtype_names = data.qtypes

        question.topics = await gdb.get_or_create_many(self.session, Topic, topic_names)
        question.languages = await gdb.get_or_create_many(
            self.session, Language, language_names
        )
        question.qtypes = await gdb.get_or_create_many(
            self.session, QuestionType, qtype_names
        )
        return question

    async def get_question_relationship_data(self, q: Question) -> Dict[str, Any]:
        # Get the topics,languages and qtypes
        topics = await gdb.get_relationship_data(q, "topics", mode="list")
        languages = await gdb.get_relationship_data(q, "languages", mode="list")
        qtypes = await gdb.get_relationship_data(q, "qtypes", mode="list")
        relationship_data = {"topics": topics, "languages": languages, "qtypes": qtypes}
        return relationship_data

    def validate_data(self, question: QuestionData | dict) -> QuestionData:
        try:
            if isinstance(question, dict):
                question = QuestionData.model_validate(question)

            if hasattr(question, "id") and getattr(question, "id"):
                logger.info("[QDB] Question ID is in data converting")
                question.id = convert_uuid(question.id)
            return question
        except ValidationError as e:
            raise Exception(f"Question is not type QuestionData Validation Error {e}")
