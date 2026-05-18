from enum import Enum
from typing import List, Optional, Sequence, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import Field as SQLField, Relationship, SQLModel

# Base Models
if TYPE_CHECKING:
    from .users import DeveloperProfile


class Status(Enum):
    ARCHIVED = "archived"
    DRAFT = "draft"
    PUBLISHED = "published"


class QuestionRelationships(BaseModel):
    topics: Sequence[str] = Field(default_factory=list)
    qTypes: Sequence[str] = Field(default_factory=list)


class QuestionCreate(QuestionRelationships):
    id: UUID | str | None = None
    title: str
    ai_generated: bool = False
    isAdaptive: bool = False

    model_config = ConfigDict(extra="forbid")


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    ai_generated: Optional[bool] = None
    isAdaptive: Optional[bool] = None
    topics: Optional[Sequence[str]] = None
    qTypes: Optional[Sequence[str]] = None

    model_config = ConfigDict(extra="forbid")


class QuestionRead(QuestionRelationships):
    id: UUID
    title: Optional[str] = None
    ai_generated: bool
    isAdaptive: bool
    storage_path: Optional[str] = None
    storage_type: str
    status: Status
    created_by_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class QuestionInternalCreate(QuestionCreate):
    storage_path: Optional[str] = None
    storage_type: str = "cloud"
    created_by_id: Optional[UUID] = None


class UpdateFile(BaseModel):
    question_id: str | UUID
    filename: str
    new_content: str | dict


class QuestionFilter(BaseModel):
    title: str


class QuestionTableRow(BaseModel):
    title: str
    question_id: UUID | str
    isAdaptive: bool
    ai_generated: bool
    status: Status
    user_id: str | UUID
    created_by: str | None = None
    institution: str


# ---------------------------------
# -----------Actual DatabaseModels-----------
# ---------------------------------


# Link tables for many to many
class QuestionTopicLink(SQLModel, table=True):
    __tablename__ = "question_topic_link"  # type: ignore
    question_id: UUID | None = SQLField(
        default=None, foreign_key="question.id", primary_key=True
    )
    topic_id: UUID | None = SQLField(
        default=None, foreign_key="topic.id", primary_key=True
    )


class QuestionQTypeLink(SQLModel, table=True):
    __tablename__ = "question_qtype_link"  # type: ignore
    question_id: UUID | None = SQLField(
        default=None, foreign_key="question.id", primary_key=True
    )
    qtype_id: UUID | None = SQLField(
        default=None, foreign_key="question_type.id", primary_key=True
    )


class Question(SQLModel, table=True):
    id: UUID | None = SQLField(default_factory=uuid4, primary_key=True, index=True)
    title: Optional[str] = SQLField(default=None, index=True)

    isAdaptive: bool = SQLField(default=False)
    ai_generated: bool = SQLField(default=False)

    storage_type: str = SQLField(default="cloud")
    storage_path: Optional[str] = None

    status: Status = SQLField(
        default=Status.DRAFT.name,
        sa_column_kwargs={"server_default": Status.DRAFT.name.upper()},
    )

    created_by_id: Optional[UUID] = SQLField(
        default=None, foreign_key="developer_profile.id"
    )
    topics: List["Topic"] = Relationship(
        back_populates="questions", link_model=QuestionTopicLink
    )
    qTypes: List["QuestionType"] = Relationship(
        back_populates="questions",
        link_model=QuestionQTypeLink,
    )
    created_by: Optional["DeveloperProfile"] = Relationship(
        back_populates="created_questions"
    )

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Topic(SQLModel, table=True):
    __tablename__ = "topic"  # type: ignore

    id: UUID = SQLField(default_factory=uuid4, primary_key=True, index=True)
    name: str = SQLField(index=True, unique=True)
    description: str | None = SQLField(default=None)

    questions: List[Question] = Relationship(
        back_populates="topics",
        link_model=QuestionTopicLink,
    )


class QuestionType(SQLModel, table=True):
    __tablename__ = "question_type"  # type: ignore
    id: UUID = SQLField(default_factory=uuid4, primary_key=True)
    name: str = SQLField(index=True, unique=True)

    questions: List[Question] = Relationship(
        back_populates="qTypes",
        link_model=QuestionQTypeLink,
    )
