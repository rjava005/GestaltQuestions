from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ThreadCreate(BaseModel):
    thread_id: UUID | str | None = None


class MessageCreate(BaseModel):
    role: str
    content: list[dict[str, Any]]
