# Standard library
from uuid import UUID, uuid4
from enum import Enum
from typing import List, TYPE_CHECKING

# Third-party libraries
from sqlmodel import Field, SQLModel, Relationship
from src.types import ValidInstitutions

if TYPE_CHECKING:
    from .users import User


class Institution(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: ValidInstitutions
    description: str | None = None

    users: List["User"] = Relationship(back_populates="institution")
