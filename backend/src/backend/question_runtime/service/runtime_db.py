from collections.abc import Sequence

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from backend.core import logger
from backend.question_runtime.exceptions import (
    QuestionRuntimeCreateError,
    QuestionRuntimeReadError,
    QuestionRuntimeUpdateError,
    QuestionRuntimeUpsertError,
)
from backend.question_runtime.model import QuestionRunTime, RuntimeLanguage
from backend.question_runtime.schema import QuestionRuntimeCreate, QuestionRuntimeUpdate
from backend.shared import ID
from backend.utils import convert_uuid


class QuestionRuntimeDB:
    """Database access layer for question runtime records."""

    def __init__(self, session: Session) -> None:
        """Initialize the repository with a database session."""
        self._session = session

    async def list_question_runtimes(
        self, question_id: ID
    ) -> Sequence[QuestionRunTime]:
        """Return enabled runtimes for a question."""
        try:
            stmt = select(QuestionRunTime).where(
                QuestionRunTime.question_id == convert_uuid(question_id),
                QuestionRunTime.enabled,
            )
            return list(self._session.exec(stmt).all())

        except SQLAlchemyError as e:
            self._session.rollback()
            logger.exception(
                "Failed to list question runtimes for question_id=%s", question_id
            )
            raise QuestionRuntimeReadError(
                f"Failed to list question runtimes for question {question_id}"
            ) from e

    async def get_for_language(
        self, question_id: ID, language: RuntimeLanguage
    ) -> QuestionRunTime | None:
        """Return the enabled runtime for a question and language, if one exists."""
        try:
            stmt = select(QuestionRunTime).where(
                QuestionRunTime.question_id == convert_uuid(question_id),
                QuestionRunTime.language == language,
                QuestionRunTime.enabled,
            )
            return self._session.exec(stmt).first()
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.exception(
                "Failed to get question runtime for question_id=%s language=%s",
                question_id,
                language,
            )
            raise QuestionRuntimeReadError(
                f"Failed to get question runtime for question {question_id} and language {language}. Error {e}"
            ) from e

    async def get_default(self, question_id: ID) -> QuestionRunTime | None:
        """Return the enabled default runtime for a question, if one exists."""
        try:
            statement = select(QuestionRunTime).where(
                QuestionRunTime.question_id == convert_uuid(question_id),
                QuestionRunTime.is_default == True,  # noqa: E712
                QuestionRunTime.enabled == True,  # noqa: E712
            )
            return self._session.exec(statement).first()
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.exception(
                "Failed to get default question runtime for question_id=%s", question_id
            )
            raise QuestionRuntimeReadError(
                f"Failed to get default question runtime for question {question_id}"
            ) from e

    async def create(
        self, question_id: ID, data: QuestionRuntimeCreate
    ) -> QuestionRunTime:
        """Create and return a question runtime."""
        try:
            runtime = QuestionRunTime(
                question_id=convert_uuid(question_id), **data.model_dump()
            )
            self._session.add(runtime)
            self._session.commit()
            self._session.refresh(runtime)
            return runtime
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.exception(
                "Failed to create question runtime for question_id=%s", question_id
            )
            raise QuestionRuntimeCreateError(
                f"Failed to create question runtime for question {question_id}"
            ) from e

    async def update(self, runtime: QuestionRunTime, data: QuestionRuntimeUpdate):
        """Update and return a question runtime."""
        try:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(runtime, key, value)
            self._session.add(runtime)
            self._session.commit()
            self._session.refresh(runtime)
            return runtime
        except SQLAlchemyError as e:
            self._session.rollback()
            runtime_id = getattr(runtime, "id", None)
            logger.exception("Failed to update question runtime id=%s", runtime_id)
            raise QuestionRuntimeUpdateError(
                f"Failed to update question runtime {runtime_id}"
            ) from e

    async def upsert(
        self, question_id: ID, data: QuestionRuntimeCreate
    ) -> QuestionRunTime:
        """Create or update a question runtime for the requested language."""
        try:
            existing = await self.get_for_language(question_id, data.language)

            if existing is None:
                return await self.create(question_id, data)

            return await self.update(
                existing,
                QuestionRuntimeUpdate(
                    entry=data.entry,
                    func_name=data.func_name,
                    is_default=data.is_default,
                    enabled=data.enabled,
                ),
            )
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.exception(
                "Failed to upsert question runtime for question_id=%s language=%s",
                question_id,
                data.language,
            )
            raise QuestionRuntimeUpsertError(
                f"Failed to upsert question runtime for question {question_id} and language {data.language}"
            ) from e
