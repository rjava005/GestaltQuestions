from typing import List, Any
from pydantic import BaseModel


class FileData(BaseModel):
    filename: str
    content: dict | str | Any | bytes
    mime_type: str = "application/octet-stream"


class FilesData(BaseModel):
    files: List[FileData]
