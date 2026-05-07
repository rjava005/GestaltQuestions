from typing import Sequence

from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.core import logger, SessionDep
from src.model.users import (
    User,
    UserUpdate,
    UserCreate,
)
from src.utils import convert_uuid
from src.app_types.general import ID


class UserDB:
    def __init__(self, session: SessionDep):
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
            raise Exception(error_message)

    async def get_user(self, id: ID) -> User | None:
        if id is None:
            raise ValueError("[DB] Failed to retrieve user. ID cannot be None")
        id = convert_uuid(id)
        try:
            stmt = select(User).where(User.id == id)
            user = self.session.exec(stmt).first()
            return user
        except Exception as e:
            self.session.rollback()
            error_message = f"[DB] Failed to get user: {e}"
            raise ValueError(error_message)

    async def get_user_by_email(self, email: str) -> User | None:
        try:
            stmt = select(User).where(User.email == email.strip())
            user = self.session.exec(stmt).first()
            return user
        except Exception as e:
            self.session.rollback()
            error_message = f"[DB] Failed to get user: {e}"
            raise ValueError(error_message)

    async def get_all_users(self, offset: int = 0, limit: int = 100) -> Sequence[User]:
        try:
            stmt = select(User).offset(offset).limit(limit)
            return self.session.exec(stmt).all()
        except Exception as e:
            self.session.rollback()
            error_message = "[DB] failed to get all users"
            raise Exception(error_message)

    async def delete_user(self, id: ID) -> bool:
        user = await self.get_user(id)
        if not user:
            logger.warning(f"DB User not found cannot delete")
            return False
        try:
            self.session.delete(user)
            self.session.commit()
            logger.info(f"[DB] Deleted user {user.id} successfully")
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            error_message = f"[DB] Failed to delete user: {e}"
            logger.error(error_message)
            raise ValueError(error_message)

    async def update_user(self, id: ID, data: UserUpdate):
        user = await self.get_user(id)
        if not user:
            raise ValueError("[DB] Failed to get user")
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
            raise ValueError(f"[DB] Failed to edit user: {e}")

    async def _validate_data(self, data: UserCreate | dict):
        try:
            if isinstance(data, dict):
                data = UserCreate.model_validate(data)
            return data
        except ValidationError as e:
            logger.error("Validation error for user %s", e)
            raise
