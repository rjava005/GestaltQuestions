from typing import List, Any, Optional
from pydantic import BaseModel
from pathlib import Path
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .users import User


class FileData(BaseModel):
    filename: str
    content: dict | str | Any | bytes
    mime_type: str = "application/octet-stream"


class FilesData(BaseModel):
    files: List[FileData]


class SuccessFileServiceResponse(BaseModel):
    status: int
    detail: Optional[str | Path] = None
    path: str


class Folder(SQLModel):
    __tablename__ = "folder"  # type: ignore
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID | None = Field(default=None, foreign_key="user.id", primary_key=True)
    name: str
    parent_id: None = Field(default=None)
    full_path: str | None = Field(default=None)
