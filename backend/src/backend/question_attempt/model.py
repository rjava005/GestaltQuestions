from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, func
from sqlalchemy.types import JSON
from sqlmodel import Field as SQLField
from sqlmodel import SQLModel

from .schema import QuizData


class QuestionAttempt(SQLModel, table=True):
    __tablename__ = "question_attempt_link"  # type: ignore
    # Id for the attemp history
    id: UUID | None = SQLField(default_factory=uuid4, primary_key=True, index=True)
    question_id: UUID | None = SQLField(
        default=None, foreign_key="question.id", primary_key=True
    )
    user_id: UUID | None = SQLField(
        default=None, foreign_key="user.id", primary_key=True
    )
    quiz_data: QuizData | dict[str, Any] = SQLField(
        sa_column=Column(JSON, nullable=False)
    )
    submitted_answer: dict[str, Any] = SQLField(sa_column=Column(JSON, nullable=False))
    is_correct: bool = False
    attemption_time: datetime = SQLField(
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        ),
        default_factory=lambda: datetime.now(UTC),
    )
