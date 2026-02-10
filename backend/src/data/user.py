from typing import Annotated, Sequence

from fastapi import Depends
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.core import logger, SessionDep
from src.model.institution import Institution, ValidInstitutions
from src.model.question import Question
from src.model.users import (
    Role,
    User,
)
from src.utils import convert_uuid

from src.types import ID, UserBase, UserRoles, UserUpdate


class UserDB:
    def __init__(self, session: SessionDep):
        self.session = session

    async def create_user(self, data: UserBase | dict) -> User:
        data = await self.validate_data(data)
        try:
            user = User(
                fb_id=data.fb_id,
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

    async def get_user_by_token(self, token: str) -> User | None:
        try:
            stmt = select(User).where(User.fb_id == token.strip())
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
            logger.warn(f"DB User not found cannot delete")
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

    async def validate_data(self, data: UserBase | dict):
        try:
            if isinstance(data, dict):
                data = UserBase.model_validate(data)
            return data
        except ValidationError as e:
            logger.error("Validation error for user %s", e)
            raise

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

    async def set_user_role(self, id: ID, role: UserRoles):
        r = self.session.exec(select(Role).where(Role.name == role)).first()
        if r is None:
            raise ValueError(f"Role {r} not present in database ")
        user = await self.get_user(id)
        if not user:
            raise ValueError("[DB] Failed to get user")
        try:
            user.role = r
            self.session.commit()
            self.session.refresh(user)
            return user
        except Exception:
            raise

    async def set_user_question(self, id: ID, question: Question) -> User:
        user = await self.get_user(id)
        if not user:
            raise ValueError("[DB] Failed to get user")
        try:
            user.created_questions.append(question)
            self.session.commit()
            self.session.refresh(user)
            return user
        except Exception:
            raise

    async def set_user_institution(
        self, id: ID, institution: Institution | ValidInstitutions
    ) -> User:
        user = await self.get_user(id)
        if not user:
            raise ValueError("[DB] Failed to get user")
        if isinstance(institution, ValidInstitutions):
            institution = self.session.exec(
                select(Institution).where(Institution.name == institution.value)
            ).one()
        try:
            user.institution = institution
            self.session.commit()
            self.session.refresh(user)
            return user
        except Exception:
            raise


def get_user_database(session: SessionDep) -> UserDB:
    return UserDB(session)


UserManagerDependeny = Annotated[UserDB, Depends(get_user_database)]
