from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

if TYPE_CHECKING:
    from backend.auth.model import Institution, User


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

    @classmethod
    def from_model(cls, user: User) -> UserRead:
        return cls(
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            email=user.email,
            roles=[role.name for role in user.roles],
            institution=user.institution.name if user.institution else None,
        )


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None


class InstitutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: ValidInstitutions
    description: str | None = None


class UserDetailRead(UserRead):
    id: UUID

    @classmethod
    def from_model(cls, user: User) -> UserDetailRead:
        return cls(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            email=user.email,
            roles=[role.name for role in user.roles],
            institution=user.institution.name if user.institution else None,
        )


class CreateUserFullPayload(BaseModel):
    user: UserCreate
    role: UserRoles = UserRoles.STUDENT
    institution: ValidInstitutions | None = None


class UpdateUserRole(BaseModel):
    role: UserRoles


class UpdateUserInstitution(BaseModel):
    institution: ValidInstitutions


class UserInstResponse(BaseModel):
    user: UserDetailRead
    inst: InstitutionRead | None = None

    @classmethod
    def from_model(
        cls, user: User, inst: Institution | None = None
    ) -> UserInstResponse:
        return cls(
            user=UserDetailRead.from_model(user),
            inst=InstitutionRead.model_validate(inst) if inst else None,
        )
