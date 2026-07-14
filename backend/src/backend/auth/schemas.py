from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, EmailStr
from sqlmodel import Field


class ValidInstitutions(StrEnum):
    UCR = "University of California, Riverside"
    CPP = "California State Polytechnic University, Pomona"
    NORCO = "Norco College"


class UserRoles(StrEnum):
    ADMIN = "admin"
    TEACHER = "teacher"
    DEVELOPER = "developer"
    STUDENT = "student"


class UserBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None


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
    roles: list[UserRoles | str] = Field(..., default_factory=list)
    institution: ValidInstitutions | None = None


class RoleRead(BaseModel):
    id: UUID
    name: str
    description: str | None = None


class InstitutionRead(BaseModel):
    id: UUID
    name: ValidInstitutions
    description: str | None = None


class UserDetailRead(UserRead):
    id: UUID


class CreateUserFullPayload(BaseModel):
    user: UserCreate
    role: UserRoles = UserRoles.STUDENT
    institution: ValidInstitutions | None = None


class UpdateUserRole(BaseModel):
    role: UserRoles


class UpdateUserInstitution(BaseModel):
    institution: "ValidInstitutions"


class UserRoleResponse(BaseModel):
    user: UserDetailRead
    roles: list[RoleRead] = Field(default_factory=list)


class UserInstResponse(BaseModel):
    user: UserDetailRead
    inst: InstitutionRead | None = None
