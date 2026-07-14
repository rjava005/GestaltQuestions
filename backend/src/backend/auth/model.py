from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from .schemas import ValidInstitutions

if TYPE_CHECKING:
    from backend.chat.model import Thread
    from backend.question import Question


class Institution(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: ValidInstitutions
    description: str | None = None

    users: list["User"] = Relationship(back_populates="institution")


class UserRoleLink(SQLModel, table=True):
    __tablename__ = "user_role_link"  # type: ignore
    role_id: UUID | None = Field(default=None, foreign_key="role.id", primary_key=True)
    # References the user.id column
    user_id: UUID | None = Field(default=None, foreign_key="user.id", primary_key=True)


# Role table
class Role(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True)
    description: str | None = None

    users: list["User"] = Relationship(back_populates="roles", link_model=UserRoleLink)


# Base class for our user, this is to faciliate stuff such as reading from our database
class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str
    last_name: str
    username: str | None = Field(default=None, unique=True)
    email: str = Field(index=True)

    roles: list["Role"] = Relationship(back_populates="users", link_model=UserRoleLink)

    institution_id: UUID | None = Field(default=None, foreign_key="institution.id")
    institution: Optional["Institution"] = Relationship(back_populates="users")

    developer_profile: Optional["DeveloperProfile"] = Relationship(
        back_populates="user"
    )
    threads: list["Thread"] = Relationship(back_populates="user")


class DeveloperProfile(SQLModel, table=True):
    __tablename__ = "developer_profile"  # type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)

    user: Optional["User"] = Relationship(back_populates="developer_profile")
    storage_path: str | None = None
    created_questions: list["Question"] = Relationship(back_populates="created_by")
