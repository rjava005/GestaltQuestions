from pydantic import BaseModel, Field
from typing import Literal, Sequence, Annotated, Dict
from src.types import QuizData


AllowedServer = Literal["server.js", "server.py"]
AllowedLanguages = Literal["python", "javascript"]
MappingServer: Dict[AllowedLanguages, AllowedServer] = {
    "python": "server.py",
    "javascript": "server.js",
}


class SandboxResponse(BaseModel):
    output: str | dict  # final returned value
    logs: Sequence[str] = []


class ServerRunSuccess(BaseModel):
    status: Literal["success"] = "success"
    data: QuizData


class ServerExecutionError(BaseModel):
    status: Literal["execution_error"] = "execution_error"
    error_type: Literal["runtime", "syntax", "dependency", "timeout", "validation"]
    message: str
    language: AllowedLanguages
    # Optional might add these
    file: str | None = None


ServerRunResponse = Annotated[
    ServerRunSuccess | ServerExecutionError,
    Field(discriminator="status"),
]
