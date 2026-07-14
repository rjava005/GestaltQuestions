from pathlib import Path
from typing import Any

from fastapi import UploadFile
from pydantic import BaseModel


class FileData(BaseModel):
    filename: str
    content: dict | str | Any | bytes
    mime_type: str = "application/octet-stream"


class FilesData(BaseModel):
    files: list[FileData]


class SuccessFileServiceResponse(BaseModel):
    status: int
    detail: str | Path | None = None
    path: str


FILE = str | UploadFile | FileData
