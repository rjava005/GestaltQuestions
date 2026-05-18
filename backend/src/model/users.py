from enum import Enum
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, EmailStr
from sqlmodel import Field, Relationship, SQLModel
from .institution import Institution, ValidInstitutions

if TYPE_CHECKING:
    from .question import Question
    from .thread import Thread


class UserRoles(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    DEVELOPER = "developer"
    STUDENT = "student"


class UserBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None


# Base Model for reading users
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    username: str | None = None
    password: str
    email: EmailStr


class UserUpdate(UserBase):
    email: str | None = None


class UserRead(UserBase):
    email: str | None = None
    roles: List[UserRoles | str] = Field(..., default_factory=list)
    institution: ValidInstitutions | None = None


class CreateUserFullPayload(BaseModel):
    user: UserCreate
    role: UserRoles = UserRoles.STUDENT
    institution: ValidInstitutions | None = None


class UpdateUserRole(BaseModel):
    role: UserRoles


class UpdateUserInstitution(BaseModel):
    institution: "ValidInstitutions"


class UserRoleResponse(BaseModel):
    user: "User"
    roles: List["Role"] = []


class UserInstResponse(BaseModel):
    user: "User"
    inst: Optional["Institution"] = None


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

    users: List["User"] = Relationship(back_populates="roles", link_model=UserRoleLink)


# Base class for our user, this is to faciliate stuff such as reading from our database
class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str
    last_name: str
    username: str | None = Field(default=None, unique=True)
    email: str = Field(index=True)

    roles: List["Role"] = Relationship(back_populates="users", link_model=UserRoleLink)

    institution_id: Optional[UUID] = Field(default=None, foreign_key="institution.id")
    institution: Optional["Institution"] = Relationship(back_populates="users")

    developer_profile: Optional["DeveloperProfile"] = Relationship(
        back_populates="user"
    )
    threads: List["Thread"] = Relationship(back_populates="user")


class DeveloperProfile(SQLModel, table=True):
    __tablename__ = "developer_profile"  # type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)

    user: Optional["User"] = Relationship(back_populates="developer_profile")
    storage_path: Optional[str] = None
    created_questions: List["Question"] = Relationship(back_populates="created_by")


UserRoleResponse.model_rebuild()
UserInstResponse.model_rebuild()
