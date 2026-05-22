from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import JSON

JSONType = JSON().with_variant(JSONB, "postgresql")

if TYPE_CHECKING:
    from .users import User


class ThreadCreate(BaseModel):
    thread_id: UUID | str | None = None


class MessageCreate(BaseModel):
    role: str
    content: list[dict[str, Any]]


class Thread(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    user: "User" = Relationship(back_populates="threads")
    user_id: UUID = Field(foreign_key="user.id")
    messages: list["Message"] = Relationship(back_populates="thread")


class Message(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)

    thread_id: UUID = Field(foreign_key="thread.id")
    role: str
    content: list[dict[str, Any]] = Field(sa_column=Column(JSONType))
    created_at: datetime = Field(default_factory=datetime.now)

    thread: "Thread" = Relationship(back_populates="messages")
