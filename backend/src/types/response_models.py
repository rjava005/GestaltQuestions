from pathlib import Path
from typing import List, Union
from pydantic import BaseModel, Field
from .file_data import FileData


class SuccessfulResponse(BaseModel):
    """Base success response shared by all API responses."""

    status: int  # keep this strict (HTTP status codes are int)
    detail: str


class SuccessDataResponse(SuccessfulResponse):
    """Success response with a file system path included."""

    data: Union[str, bytes, None] = None


class SuccessFileResponse(SuccessfulResponse):
    """Success response with one or more file objects."""

    filedata: List[FileData] = Field(
        default_factory=list,
        description="List of file objects or file strings",
    )
    filenames: List[str] | List[Path] = Field(
        default_factory=list,
        description="List of relative file paths",
    )

    class Config:
        populate_by_name = True  # allows using both aliases & python names


class Response(BaseModel):
    status: int
    detail: str

class SuccessFileServiceResponse(SuccessfulResponse):
    path: str | Path