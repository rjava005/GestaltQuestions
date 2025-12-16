from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, func
from sqlmodel import SQLModel, Field as SQLField


class QuizData(BaseModel):
    params: Dict[str, Any]
    correct_answers: Dict[str, Any]
    intermediate: Optional[Dict[str, Any]] = None
    test_results: Optional[Dict[str, Any]] = None
    logs: List[Any] = []
    nDigits: Optional[int] = 3
    sigfigs: Optional[int] = 3
    model_config = {"extra": "allow"}  # Ignore unexpected fields and missing ones


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
    quiz_data: QuizData
    submitted_answer: Dict[str, Any]
    attemption_time: datetime = SQLField(
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        ),
        default_factory=lambda: datetime.now(timezone.utc),
    )
