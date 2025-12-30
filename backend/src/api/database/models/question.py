# Standard library
from typing import List, Optional, Sequence, Literal, TYPE_CHECKING
from uuid import UUID, uuid4
from enum import Enum

# Third-party libraries
from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import Field as SQLField, Relationship, SQLModel
from sqlalchemy import text
from .question_ownership import QuestionOwnership

if TYPE_CHECKING:
    from .users import User


AllowedLanguages = Literal["javascript", "python"]


class Status(Enum):
    ARCHIVED = "archived"
    DRAFT = "draft"
    PUBLISHED = "published"


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


class QuestionLanguageLink(SQLModel, table=True):
    __tablename__ = "question_language_link"  # type: ignore
    question_id: UUID | None = SQLField(
        default=None, foreign_key="question.id", primary_key=True
    )
    language_id: UUID | None = SQLField(
        default=None, foreign_key="language.id", primary_key=True
    )


class Question(SQLModel, table=True):
    id: UUID | None = SQLField(default_factory=uuid4, primary_key=True, index=True)
    title: Optional[str] = SQLField(default=None, index=True)

    # General Flags
    isAdaptive: bool = SQLField(default=False)
    ai_generated: bool = SQLField(default=False)

    # Storage where the question is saved
    local_path: Optional[str] = None
    blob_path: Optional[str] = None

    # Status of the question whheter it is published, archived etc
    status: Status = SQLField(
        default=Status.DRAFT, sa_column_kwargs={"server_default": text("'draft'")}
    )

    # Relationships

    # General relationship for metadata
    topics: List["Topic"] = Relationship(
        back_populates="questions", link_model=QuestionTopicLink
    )
    qtypes: List["QuestionType"] = Relationship(
        back_populates="questions", link_model=QuestionQTypeLink
    )
    languages: List["Language"] = Relationship(
        back_populates="questions", link_model=QuestionLanguageLink
    )

    # handle ownership
    created_by: Optional["User"] = Relationship(
        back_populates="created_questions", link_model=QuestionOwnership
    )


#
class Topic(SQLModel, table=True):
    __tablename__ = "topic"  # type: ignore

    id: UUID = SQLField(default_factory=uuid4, primary_key=True, index=True)
    name: str = SQLField(index=True, unique=True)
    description: str | None = SQLField(default=None)

    questions: List[Question] = Relationship(
        back_populates="topics",
        link_model=QuestionTopicLink,
    )


class Language(SQLModel, table=True):
    id: UUID = SQLField(default_factory=uuid4, primary_key=True, index=True)
    name: str = SQLField(index=True, unique=True)
    description: str | None = SQLField(default=None)
    questions: List[Question] = Relationship(
        back_populates="languages",
        link_model=QuestionLanguageLink,
    )


class QuestionType(SQLModel, table=True):
    __tablename__ = "question_type"  # type: ignore
    id: UUID = SQLField(default_factory=uuid4, primary_key=True)
    name: str = SQLField(index=True, unique=True)

    questions: List[Question] = Relationship(
        back_populates="qtypes",
        link_model=QuestionQTypeLink,
    )


# Base Models
class QuestionBase(BaseModel):
    id: str | UUID | None = None
    title: Optional[str] = None
    ai_generated: Optional[bool] = None
    isAdaptive: Optional[bool] = None
    question_path: str | None = None
    model_config = ConfigDict(extra="ignore")


class QuestionMeta(QuestionBase):
    topics: List["Topic"] = Field(default_factory=list)
    languages: List["Language"] = Field(default_factory=list)
    qtypes: List["QuestionType"] = Field(default_factory=list)


class QRelationshipData(BaseModel):
    topics: Sequence[str] = Field(default_factory=list)
    qtypes: Sequence[str] = Field(default_factory=list)
    languages: Sequence[str] = Field(default_factory=list)


class QuestionData(QuestionBase, QRelationshipData):
    pass
