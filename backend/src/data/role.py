from typing import Dict, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.core import logger, SessionDep
from src.model.users import Role
from src.types import UserRoles


class RoleManager:
    def __init__(self, session: SessionDep):
        self.session = session

    async def create_role(
        self,
        role: UserRoles,
        description: str | None = "",
    ) -> Optional[Role]:
        try:
            r = Role(name=role.value, description=description)
            self.session.add(r)
            self.session.commit()
            self.session.refresh(r)
            logger.debug("[DB] Role created successfully")
            return r

        except SQLAlchemyError as e:
            self.session.rollback()
            logger.error(f"[DB] Failed to create role: {e}")
            return None

    async def get_role_data(
        self,
        role: str,
    ) -> Role | None:
        r = self.session.exec(select(Role).where(Role.name == role)).first()
        return r

    async def seed_roles(self):
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
                if self.does_role_exist(r):
                    continue
                await self.create_role(r, description=des)
        except Exception:
            raise

    async def does_role_exist(
        self,
        role: UserRoles,
    ) -> bool | None:
        try:
            return bool(
                self.session.exec(select(Role).where(Role.name == role.value)).first()
            )
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.error(f"[DB] Failed to get role: {e}")
            return None
