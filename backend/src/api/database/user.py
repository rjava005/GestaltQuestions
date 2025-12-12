from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select
from src.utils import convert_uuid
from src.api.core import logger
from src.api.database.database import SessionDep
from src.api.models.users import User, UserRoles
from src.api.models.question import (
    Question,
)
from src.utils import convert_uuid


def create_user(
    uid: str,
    first_name: str,
    last_name: str,
    email: str,
    username: str,
    session: SessionDep,
) -> Optional[User]:
    try:
        user = User(
            fb_id=uid,
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        logger.info(f"[DB] Created user {user.id}")
        return user
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to create user: {e}")
        return None


def get_user(id: str | UUID, session: SessionDep):
    try:
        id = convert_uuid(id)
        stmt = select(User).where(User.id == id)
        user = session.exec(stmt).first()
        if user:
            logger.debug(f"[DB] Found user: {user.id}")
        else:
            logger.debug(f"[DB] User not found for id: {id}")
        return user
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to get user: {e}")
        return None


def get_user_by_email(email: str, session: SessionDep) -> Optional[User]:
    try:
        stmt = select(User).where(User.email == email.strip())
        user = session.exec(stmt).first()
        if user:
            logger.debug(f"[DB] Found user: {user.id}")
        else:
            logger.debug(f"[DB] User not found for id: {id}")
        return user
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to get user: {e}")
        return None


def get_user_by_fb(id: str, session: SessionDep) -> Optional[User]:
    try:

        stmt = select(User).where(User.fb_id == id)
        user = session.exec(stmt).first()
        if user:
            logger.debug(f"[DB] Found user: {id}")
        else:
            logger.debug(f"[DB] User not found for id: {id}")
        return user
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to get user: {e}")
        return None


def get_all_users(
    session: SessionDep,
    offset: int = 0,
    limit: int = 100,
) -> Sequence[User]:
    stmt = select(User).offset(offset).limit(limit)
    return session.exec(stmt).all()


def delete_user(id: str | UUID, session: SessionDep) -> None:
    """Delete a user from the database by ID."""
    try:
        logger.info("[DB] Deleting user...")
        user = get_user(id, session)
        if not user:
            logger.warning(f"[DB] No user found for id: {id}")
            return

        session.delete(user)
        session.commit()
        logger.info(f"[DB] Deleted user {user.id} successfully")
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to delete user: {e}")


def update_user(id: str | UUID, data: User, session: SessionDep) -> Optional[User]:
    try:
        user = get_user(id, session)
        update_data_dict = data.model_dump(exclude_unset=True)
        for key, value in update_data_dict.items():
            setattr(user, key, value)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to edit user: {e}")
        raise ValueError("[DB] Failed to edit user: {e}")


def get_user_created_questions(user_id: str | UUID, session: SessionDep):
    stmt = select(Question).where(Question.created_by_id == user_id)
    return session.exec(stmt).all()


def set_user_created_questions(
    user_id: str | UUID, question: Question, session: SessionDep
):
    try:
        question.created_by_id = convert_uuid(user_id)
        session.add(question)
        session.commit()
        session.refresh(question)
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to set question to user: {e}")
        raise ValueError("[DB] Failed to set question to user: {e}")
