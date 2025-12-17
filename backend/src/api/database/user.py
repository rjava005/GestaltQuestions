from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.api.core import logger
from src.api.database.database import SessionDep
from src.api.db_models.question import Question
from src.api.db_models.users import (
    User,
    UserBase,
    UserRoles,
    UserUpdate,
    ValidInstitutions,
)
from src.utils import convert_uuid

from .role import get_role
from .institution import get_institution


def create_user(
    data: UserBase,
    session: SessionDep,
) -> Optional[User]:

    try:
        user = User(
            fb_id=data.fb_id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            username=data.username,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        logger.info(f"[DB] Created base user {user.id}")
        # Handle the assignment of the role and institution

        return user
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to create user: {e}")
        return None


def create_user_full(
    data: UserBase,
    session: SessionDep,
    role: UserRoles = UserRoles.STUDENT,
    institution: ValidInstitutions | None = None,
) -> User:
    user = create_user(data, session)
    logger.debug(f"User created succesfully {user}")
    assert user
    user = set_user_role(user.id, role, session)
    if institution:
        user = set_user_institution(user.id, institution, session)
    return user


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
        logger.info("Running")
        stmt = select(User).where(User.email == email.strip())
        user = session.exec(stmt).first()
        if user:
            logger.info(f"[DB] Found user: {user.id}")
        else:
            logger.info(f"[DB] User not found for id: {id}")
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


def update_user(
    id: str | UUID, data: UserUpdate, session: SessionDep
) -> Optional[User]:
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
    user = get_user(user_id, session)
    stmt = select(Question).where(Question.created_by == user)
    return session.exec(stmt).all()


# -------------------------
# --------Hybrid-----------
# -------------------------

# these are database stuff that usually deals with relationship and or some other stuff


def set_user_created_questions(
    user_id: str | UUID, question: Question, session: SessionDep
):
    try:
        question.created_by = get_user(user_id, session)
        session.add(question)
        session.commit()
        session.refresh(question)
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to set question to user: {e}")
        raise ValueError("[DB] Failed to set question to user: {e}")


def set_user_role(user_id: str | UUID, role: UserRoles, session: SessionDep) -> User:
    try:
        r = get_role(role.value, session)
        if r is None:
            raise ValueError(f"Role {r} not present in database ")
        user = get_user(user_id, session)
        if user is None:
            raise ValueError(f"Could not retrieve user {user}")
        user.role = r
        session.commit()
        session.refresh(user)
        return user
    except Exception:
        raise


def set_user_institution(
    user_id: str | UUID, institution: ValidInstitutions, session: SessionDep
) -> User:
    try:
        inst = get_institution(institution.value, session)
        if inst is None:
            raise ValueError(f"Role {inst} not present in database ")
        user = get_user(user_id, session)
        if user is None:
            raise ValueError(f"Could not retrieve user {user}")
        user.institution = inst
        user.institution_id = inst.id
        session.commit()
        session.refresh(user)
        return user
    except Exception:
        raise
