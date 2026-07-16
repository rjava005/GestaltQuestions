from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from backend.auth import ValidInstitutions
from backend.question import QType, Status
from backend.question_runtime.model import RuntimeLanguage


class QuestionSearchParams(BaseModel):
    # Search query for title
    search: str | None = None
    # Filter question based on status
    status: Status | None = None
    # Filter based on institution
    institution: ValidInstitutions | None = None
    # filter question based on question type
    qtype: QType | list[QType] | None = None
    # general term for searching topics based on topics
    topic: str | None = None
    # Search the question based on runtime data
    language: RuntimeLanguage | list[RuntimeLanguage] | None = None
    # Backend-only filter for published table queries
    published: bool | None = None

    isAdaptive: bool | None = None
    # General offset and limits
    limit: int = 50
    offset: int = 0


class QuestionTableRow(BaseModel):
    question_id: UUID
    owner_id: UUID
    developer_profile_id: UUID
    title: str
    institution_id: UUID
    institution: str
    created_by: str
    status: Status | str
    topics: list[str | None] | None
    question_type: list[QType | str | None] | None
    available_runtimes: list[RuntimeLanguage | str]
    created_at: datetime | None = None
    updated_at: datetime | None = None
