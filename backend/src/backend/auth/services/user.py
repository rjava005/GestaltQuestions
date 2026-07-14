from collections.abc import Sequence

from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from backend.auth.exceptions import (
    UserCreateError,
    UserDeleteError,
    UserNotFound,
    UserReadError,
    UserUpdateError,
    UserValidationError,
)
from backend.auth.model import User
from backend.auth.schemas import UserCreate, UserUpdate
from backend.core import logger
from backend.shared.schema import ID
from backend.utils import convert_uuid


class UserDB:
    def __init__(self, session: Session) -> None:
        self.session = session

    async def create_user(self, data: UserCreate | dict) -> User:
        data = await self._validate_data(data)
        try:
            user = User(
                first_name=data.first_name,
                last_name=data.last_name,
                username=data.username,
                email=data.email,
            )
            self.session.add(user)
            self.session.commit()
            self.session.refresh(user)
            return user
        except SQLAlchemyError as e:
            self.session.rollback()
            error_message = f"[DB] Failed to create user: {e}"
            logger.error(error_message)
            raise UserCreateError(details=str(e)) from e

    async def get_user(self, id: ID) -> User | None:
        if id is None:
            raise UserValidationError("User ID cannot be None")
        try:
            id = convert_uuid(id)
            stmt = select(User).where(User.id == id)
            return self.session.exec(stmt).first()
        except SQLAlchemyError as e:
            self.session.rollback()
            error_message = f"[DB] Failed to get user: {e}"
            raise UserReadError(details=error_message) from e
        except ValueError as e:
            raise UserValidationError(details=str(e)) from e

    async def get_user_by_email(self, email: str) -> User | None:
        try:
            stmt = select(User).where(User.email == email.strip())
            return self.session.exec(stmt).first()
        except SQLAlchemyError as e:
            self.session.rollback()
            error_message = f"[DB] Failed to get user: {e}"
            raise UserReadError(details=error_message) from e

    async def get_all_users(self, offset: int = 0, limit: int = 100) -> Sequence[User]:
        try:
            stmt = select(User).offset(offset).limit(limit)
            return self.session.exec(stmt).all()
        except SQLAlchemyError as e:
            self.session.rollback()
            error_message = "[DB] failed to get all users"
            raise UserReadError(error_message, details=str(e)) from e

    async def delete_user(self, id: ID) -> bool:
        user = await self.get_user(id)
        if not user:
            logger.warning("DB User not found cannot delete")
            raise UserNotFound(str(id))
        try:
            self.session.delete(user)
            self.session.commit()
            logger.info(f"[DB] Deleted user {user.id} successfully")
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            error_message = f"[DB] Failed to delete user: {e}"
            logger.error(error_message)
            raise UserDeleteError(details=error_message) from e

    async def update_user(self, id: ID, data: UserUpdate):
        user = await self.get_user(id)
        if not user:
            raise UserNotFound(str(id))
        try:
            for key, value in data.model_dump(exclude_none=True).items():
                setattr(user, key, value)
            self.session.add(user)
            self.session.commit()
            self.session.refresh(user)
            return user
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.error(f"[DB] Failed to edit user: {e}")
            raise UserUpdateError(details=str(e)) from e

    async def _validate_data(self, data: UserCreate | dict):
        try:
            if isinstance(data, dict):
                data = UserCreate.model_validate(data)
            return data
        except ValidationError as e:
            logger.error("Validation error for user %s", e)
            raise UserValidationError(details=str(e)) from e
