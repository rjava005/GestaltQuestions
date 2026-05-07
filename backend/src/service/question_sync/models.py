from typing import Literal, Sequence
from pydantic import BaseModel, ConfigDict, Field
from src.model.question import Question


class FolderCheckMetrics(BaseModel):
    total_checked: int
    deleted_from_db: int
    still_valid: int
    bug: int | None = None


class SyncMetrics(BaseModel):
    total_found: int
    synced: int
    failed: int


class FolderCheckResponse(BaseModel):
    metrics: FolderCheckMetrics
    remaining_questions: Sequence[Question]


SyncStatus = Literal[
    "missing_metadata",  # metadata.json not found
    "invalid_metadata_json",  # JSON decode error
    "missing_id",  # ID field not found in metadata
    "not_in_database",  # Metadata ID not found in DB
    "invalid question schema",  # Question model is invalide
    "failed to create question",
    "success",  # Sync Status was successful
]

DEFAULT_SYNC_FLAGS = ("info2.json", "metadata.json", "info.json")


class SyncSetup(BaseModel):
    flags: tuple[str, ...] = Field(default=DEFAULT_SYNC_FLAGS)


class UnsyncedQuestion(BaseModel):
    question_name: str | None = None
    question_path: str | None = None
    detail: str | None = None
    status: SyncStatus = "failed to create question"
    metadata: str | None = None


class QuestionSyncMinimal(BaseModel):
    id: str | None = None
    title: str = Field(min_length=1)
    isAdaptive: bool | None = None
    model_config = ConfigDict(extra="ignore")


class SyncResponse(BaseModel):
    sync_metrics: SyncMetrics
    sync_raw: Sequence[UnsyncedQuestion]
