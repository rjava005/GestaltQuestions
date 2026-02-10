from typing import Optional, Sequence
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

# Base Models
class QuestionBase(BaseModel):
    id: str | UUID | None = None
    title: Optional[str] = None
    ai_generated: Optional[bool] = None
    isAdaptive: Optional[bool] = None
    question_path: str | None = None
    model_config = ConfigDict(extra="ignore")



class QRelationshipData(BaseModel):
    topics: Sequence[str] = Field(default_factory=list)
    qtypes: Sequence[str] = Field(default_factory=list)
    languages: Sequence[str] = Field(default_factory=list)


class QuestionData(QuestionBase, QRelationshipData):
    pass


class UpdateFile(BaseModel):
    question_id: str | UUID
    filename: str
    new_content: str | dict
