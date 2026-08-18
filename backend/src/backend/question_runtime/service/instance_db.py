from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlmodel import Session, delete, select

from backend.question_runtime.model import QuestionInstance
from backend.shared import ID
from backend.utils import convert_uuid


def utc_now() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


class QuestionInstanceDB:
    def __init__(self, session: Session) -> None:
        self._session = session

    async def create(
        self,
        question_id: ID,
        private_data: dict[str, Any],
        *,
        lifetime: timedelta = timedelta(hours=24),
    ) -> QuestionInstance:
        instance = QuestionInstance(
            question_id=convert_uuid(question_id),
            private_grading_data=private_data,
            created_at=utc_now(),
            expires_at=utc_now() + lifetime,
        )
        self._session.add(instance)
        self._session.commit()
        self._session.refresh(instance)
        return instance

    async def get(self, instance_id: UUID) -> QuestionInstance | None:
        return self._session.get(QuestionInstance, instance_id)

    async def delete(self, instance: QuestionInstance) -> None:
        self._session.delete(instance)
        self._session.commit()

    async def cleanup_expired(self, *, now: datetime | None = None) -> int:
        cutoff = (now or utc_now()).replace(tzinfo=None)
        result = self._session.exec(
            delete(QuestionInstance)
            .where(QuestionInstance.expires_at <= cutoff)
            .execution_options(synchronize_session="fetch")
        )
        self._session.commit()
        return int(getattr(result, "rowcount", 0) or 0)

    async def list_for_question(self, question_id: ID) -> list[QuestionInstance]:
        statement = select(QuestionInstance).where(
            QuestionInstance.question_id == convert_uuid(question_id)
        )
        return list(self._session.exec(statement).all())
