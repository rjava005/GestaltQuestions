# Standard library
from uuid import UUID, uuid4
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Enum as SAEnum, Column

# Third-party libraries
from sqlmodel import Field, SQLModel, Relationship
from pydantic import BaseModel
from .hybrid import QuestionOwnership
from .institution import ValidInstitutions

if TYPE_CHECKING:
    from .question import Question
    from .institution import ValidInstitutions, Institution


class UserRoles(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    DEVELOPER = "developer"
    STUDENT = "student"


# Create a link between a user a many to many relationship
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

    users: List["User"] = Relationship(back_populates="role", link_model=UserRoleLink)


# Base class for our user, this is to faciliate stuff such as reading from our database
class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str
    last_name: str
    username: str | None = Field(unique=True)
    fb_id: str | None
    email: str = Field(index=True)

    # Define the relationship
    role: "Role" = Relationship(back_populates="users", link_model=UserRoleLink)
    institution_id: Optional[UUID] = Field(default=None, foreign_key="institution.id")
    institution: Optional["Institution"] = Relationship(back_populates="users")

    # Relationship to questions
    created_questions: List["Question"] = Relationship(
        back_populates="created_by", link_model=QuestionOwnership
    )


# Base Model for reading users
class UserRead(BaseModel):
    first_name: str
    last_name: str
    username: str | None
    email: str
    institution: ValidInstitutions | None = None
    role: UserRoles | None = None


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    email: str | None = None


# This model is used for when we add users
class UserBase(UserRead):
    fb_id: str | None = None
