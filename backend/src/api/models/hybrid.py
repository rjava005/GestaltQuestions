from uuid import UUID
from enum import Enum

# Third-party libraries
from sqlmodel import Field as SQLField, SQLModel


class QuestionStatus(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class QuestionOwnership(SQLModel, table=True):
    __tablename__ = "question_ownership_link"  # type: ignore
    question_id: UUID | None = SQLField(
        default=None, foreign_key="question.id", primary_key=True
    )
    user_id: UUID | None = SQLField(
        default=None, foreign_key="user.id", primary_key=True
    )
    status: QuestionStatus = SQLField(default=QuestionStatus.PRIVATE)
    # Handle what others can do with the question
    can_view: bool = SQLField(default=False)
    can_edit: bool = SQLField(default=False)


class QuestionReview(SQLModel, table=True):
    question_id: UUID | None = SQLField(
        default=None, foreign_key="question.id", primary_key=True
    )
    reviewer_id: UUID | None = SQLField(
        default=None, foreign_key="user.id", primary_key=True
    )
    reviewed: bool = False
    # TODO: Add actual metrics for what i want to grade


class QuestionAttempt(SQLModel, table=True):
    __tablename__ = "question_attempt_link"  # type: ignore
    question_id: UUID | None = SQLField(
        default=None, foreign_key="question.id", primary_key=True
    )
    user_id: UUID | None = SQLField(
        default=None, foreign_key="user.id", primary_key=True
    )
    attempts: int = SQLField(default=0)
    completed: bool = SQLField(default=False)
