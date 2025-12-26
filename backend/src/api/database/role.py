from typing import Dict, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.api.core import logger
from src.api.core.database import SessionDep
from src.api.database.models.users import Role, UserRoles


def seed_roles(session: SessionDep) -> None:
    roles: Dict[UserRoles, str] = {
        UserRoles.ADMIN: (
            "Full system access. Can manage users, roles, institutions, "
            "questions, grading, and all platform settings."
        ),
        UserRoles.STUDENT: (
            "Learner access. Can view assigned content, attempt questions, "
            "submit answers, and view feedback and grades."
        ),
        UserRoles.DEVELOPER: (
            "Content development access. Can create, edit, and modify questions "
            "and related assets, but does not have student-facing or grading "
            "privileges such as viewing submissions or assigning grades."
        ),
        UserRoles.TEACHER: (
            "Instructional access. Can create and manage courses, assign and "
            "grade questions, view student submissions, and monitor progress."
        ),
    }

    try:
        for r, des in roles.items():
            if does_role_exist(session, r):
                continue
            create_role(session, r, description=des)
    except Exception:
        raise


def create_role(
    session: SessionDep,
    role: UserRoles,
    description: str | None = "",
) -> Optional[Role]:
    try:
        r = Role(name=role.value, description=description)
        session.add(r)
        session.commit()
        session.refresh(r)
        logger.debug("[DB] Role created successfully")
        return r

    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to create role: {e}")
        return None


def does_role_exist(
    session: SessionDep,
    role: UserRoles,
) -> bool | None:
    try:
        return bool(session.exec(select(Role).where(Role.name == role.value)).first())
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to get role: {e}")
        return None


def get_role(role: str, session: SessionDep) -> Role | None:
    return session.exec(select(Role).where(Role.name == role)).first()
