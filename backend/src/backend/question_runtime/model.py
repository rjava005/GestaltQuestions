from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, DateTime, Index, UniqueConstraint
from sqlmodel import Field, SQLModel, text


class RuntimeLanguage(StrEnum):
    JAVASCRIPT = "javascript"
    PYTHON = "python"


class RuntimeConfigSource(StrEnum):
    MANUAL = "manual"
    CONFIG_FILE = "config_file"
    INFERRED = "inferred"


class QuestionRunTime(SQLModel, table=True):
    __tablename__ = "question_runtime"  # type: ignore
    __table_args__ = (
        UniqueConstraint(
            "question_id", "language", name="uq_question_runtime_language"
        ),
        # Each question can have at most one runtime per language.
        # Example q123->javascript occurs only once q123->python is valid,
        Index(
            "uq_question_runtime_default_enabled",
            "question_id",
            unique=True,
            postgresql_where=text("is_default=true AND enabled = true"),
            sqlite_where=text("is_default = 1 AND enabled = 1"),
        ),
    )
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    question_id: UUID = Field(foreign_key="question.id")

    language: RuntimeLanguage = Field(index=True)
    entry: str
    func_name: str = "generate"

    source: RuntimeConfigSource = RuntimeConfigSource.INFERRED

    is_default: bool = False
    enabled: bool = True


class QuestionInstance(SQLModel, table=True):
    """Opaque, expiring storage for private secure-grading data."""

    __tablename__ = "question_instance"  # type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    question_id: UUID = Field(foreign_key="question.id", index=True)
    private_grading_data: dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    expires_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC) + timedelta(hours=24),
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )
