from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select
from typing import Optional, Dict

from src.api.db_models.users import Role, UserRoles
from src.api.database.database import SessionDep

from src.api.core import logger


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
    role: UserRoles = UserRoles.STUDENT,
    description: str | None = "",
) -> Optional[Role]:
    try:
        r = Role(name=role, description=description)
        session.add(role)
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
        return bool(session.exec(select(Role).where(Role.name == role)).first())
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to get role: {e}")
        return None
