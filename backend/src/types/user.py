from enum import Enum
from src.types import ValidInstitutions

from pydantic import BaseModel


class UserRoles(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    DEVELOPER = "developer"
    STUDENT = "student"


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
