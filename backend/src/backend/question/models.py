from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field as SQLField
from sqlmodel import Relationship, SQLModel

from .schema import QType, Status

if TYPE_CHECKING:
    from backend.auth.model import DeveloperProfile


# Association tables for many-to-many relationships.
class QuestionTopicLink(SQLModel, table=True):
    __tablename__ = "question_topic_link"  # type: ignore

    question_id: UUID | None = SQLField(
        default=None,
        foreign_key="question.id",
        primary_key=True,
    )
    topic_id: UUID | None = SQLField(
        default=None,
        foreign_key="topic.id",
        primary_key=True,
    )


class QuestionQTypeLink(SQLModel, table=True):
    __tablename__ = "question_qtype_link"  # type: ignore

    question_id: UUID | None = SQLField(
        default=None,
        foreign_key="question.id",
        primary_key=True,
    )
    qtype_id: UUID | None = SQLField(
        default=None,
        foreign_key="question_type.id",
        primary_key=True,
    )


# Categorizes questions by supported question type.
class QuestionType(SQLModel, table=True):
    __tablename__ = "question_type"  # type: ignore

    id: UUID = SQLField(default_factory=uuid4, primary_key=True)
    name: QType = SQLField(index=True, unique=True)
    display_name: str | None = None
    description: str | None = None

    questions: list["Question"] = Relationship(
        back_populates="qType",
        link_model=QuestionQTypeLink,
    )


# Main question record and configuration.
class Question(SQLModel, table=True):
    id: UUID | None = SQLField(default_factory=uuid4, primary_key=True, index=True)
    title: str | None = SQLField(default=None, index=True)

    # Generation and delivery behavior.
    isAdaptive: bool = SQLField(default=False)
    ai_generated: bool = SQLField(default=False)

    # Classification relationships.
    topics: list["Topic"] = Relationship(
        back_populates="questions",
        link_model=QuestionTopicLink,
    )
    qType: list["QuestionType"] = Relationship(
        back_populates="questions",
        link_model=QuestionQTypeLink,
    )

    # Lifecycle and runtime support.
    status: Status = SQLField(
        default=Status.DRAFT.name,
        sa_column_kwargs={"server_default": Status.DRAFT.name.upper()},
    )
    # External storage location.
    storage_type: str = SQLField(default="cloud")
    storage_path: str | None = None

    # Ownership and timestamps.
    created_by: Optional["DeveloperProfile"] = Relationship(
        back_populates="created_questions",
    )
    created_by_id: UUID | None = SQLField(
        default=None,
        foreign_key="developer_profile.id",
    )
    created_at: datetime | None = SQLField(default_factory=datetime.now)
    updated_at: datetime | None = SQLField(default_factory=datetime.now)


# Topic taxonomy for grouping questions.
class Topic(SQLModel, table=True):
    __tablename__ = "topic"  # type: ignore

    id: UUID = SQLField(default_factory=uuid4, primary_key=True, index=True)
    name: str = SQLField(index=True, unique=True)
    description: str | None = SQLField(default=None)

    questions: list[Question] = Relationship(
        back_populates="topics",
        link_model=QuestionTopicLink,
    )
