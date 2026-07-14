from collections.abc import Sequence
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Status(StrEnum):
    ARCHIVED = "archived"
    DRAFT = "draft"
    PUBLISHED = "published"


class QType(StrEnum):
    MC = "mc"
    MCQ = "mcq"
    MA = "ma"
    TF = "tf"
    FB = "fb"
    NUM = "num"

    @property
    def display_name(self) -> str:
        return {
            QType.MC: "Multiple Choice",
            QType.MCQ: "Multiple Choice Question",
            QType.MA: "Multiple Answer",
            QType.TF: "True / False",
            QType.FB: "Fill in the Blank",
            QType.NUM: "Numerical",
        }[self]


# Shared relationship models
class QuestionRelationships(BaseModel):
    topics: Sequence[str] = Field(default_factory=list)
    qType: Sequence[QType] = Field(default_factory=list)


# Question request models
class QuestionCreate(QuestionRelationships):
    id: UUID | str | None = None
    title: str
    ai_generated: bool = False
    isAdaptive: bool = False

    model_config = ConfigDict(extra="forbid")


class QuestionInternalCreate(QuestionCreate):
    storage_path: str | None = None
    storage_type: str = "cloud"
    created_by_id: UUID | None = None


class QuestionUpdate(BaseModel):
    title: str | None = None
    ai_generated: bool | None = None
    isAdaptive: bool | None = None
    topics: Sequence[str] | None = None
    qType: Sequence[str] | None = None
    status: Status | None = None

    model_config = ConfigDict(extra="forbid")


class UpdateFile(BaseModel):
    question_id: str | UUID
    filename: str
    new_content: str | dict


# Question response models
class QuestionRead(QuestionRelationships):
    id: UUID
    title: str | None = None
    storage_path: str | None = None
    storage_type: str
    status: Status
    created_by_id: UUID | None = None
    ai_generated: bool
    isAdaptive: bool

    model_config = ConfigDict(from_attributes=True)


class QuestionTableRow(BaseModel):
    title: str
    question_id: UUID | str
    isAdaptive: bool
    ai_generated: bool
    status: Status
    user_id: str | UUID
    created_by: str | None = None
    institution: str


# Question query models
class QuestionFilter(BaseModel):
    title: str
    status: Status | None = None
