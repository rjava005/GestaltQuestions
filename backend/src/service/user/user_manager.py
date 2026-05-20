from typing import List, Union

from firebase_admin import auth
from sqlmodel import Session

from src.app_types.general import ID
from src.core.logging import logger
from src.data.institution import InstitutionDB
from src.data.role import RoleDB
from src.data.user import UserDB
from src.model.institution import Institution, ValidInstitutions
from src.model.users import Role, User, UserCreate, UserRoles, UserRead


class UserNotFound(Exception):
    pass


class UserManager:
    def __init__(self, udb: UserDB, rm: RoleDB, inst: InstitutionDB, session: Session):
        """Initialize user and role repositories for the provided session."""
        self.udb = udb
        self.rm = rm
        self.ins = inst
        self.session = session

    async def create_user(
        self,
        data: UserCreate,
        role: UserRoles | None = UserRoles.DEVELOPER,
        institution: ValidInstitutions | None = None,
    ) -> User:
        """Create a user and optionally attach a role."""
        user_orm = None
        try:
            user_orm = await self.udb.create_user(data)
            username = user_orm.username
            if not username:
                username = (
                    f"{user_orm.first_name}_{user_orm.last_name}_{str(user_orm.id)[:4]}"
                )
            response = auth.create_user(
                email=user_orm.email,
                display_name=username,
                uid=str(user_orm.id),
                password=data.password,
            )
            assert response
            if role:
                user_orm = await self.add_role_to_user(role, user_orm)
            if institution:
                user_orm = await self.set_user_institution(institution, user_orm)
            return user_orm
        except Exception as e:
            # Try best to role back
            if user_orm is not None:
                logger.warning(f"Failed to create user {e} attempting to rollback")
                failed_id = getattr(user_orm, "id")
                await self.udb.delete_user(failed_id)
            raise ValueError(f"[UserManager] Failed to create user {e}")

    async def add_role_to_user(self, role: UserRoles, user: Union["User", ID]) -> User:
        """Attach a role to a user if it is not already assigned."""

        user_orm = await self._resolve_user(user)
        # Get role
        r = await self.rm.get_role(role)
        if not r:
            raise ValueError(f"Role '{role}' not found")

        # Ensure same session
        r = self.session.merge(r)

        # Avoid duplicates
        if r not in user_orm.roles:
            user_orm.roles.append(r)

        # Persist
        self.session.add(user_orm)
        self.session.commit()
        self.session.refresh(user_orm)

        return user_orm

    async def set_user_institution(
        self, institution: ValidInstitutions, user: User | ID
    ):
        """Set a user's institution to a valid institution value."""
        user_orm = await self._resolve_user(user)
        inst = await self.ins.get_institution(institution)
        if inst is None:
            raise ValueError(f"Institution '{institution}' is invalid")
        user_orm.institution = inst
        self.session.add(user_orm)
        self.session.commit()
        self.session.refresh(user_orm)
        return user_orm

    async def delete_user(self, id: ID) -> None:
        """Delete a user from the database and Firebase auth."""
        try:
            logger.debug("Attempting to delete user %s", id)
            await self.udb.delete_user(id)
            logger.debug("Deleted user %s from database", id)
            auth.delete_user(uid=id)
            logger.debug("Deleted user %s from Firebase auth", id)
            return None
        except Exception as e:
            raise ValueError(f"[UserManager] Failed to delete user '{id}': {e}")

    async def get_user(self, id: ID) -> User | None:
        """Return a user by UUID or string ID."""
        return await self.udb.get_user(id)

    async def read_user(self, id: ID) -> UserRead:
        try:
            base_user = await self.get_user(id)
            if not base_user:
                raise UserNotFound(f"Cannot find user with id {id}")
            user_roles = await self.get_user_role(id)
            institution = await self.get_user_inst(id)
            return UserRead(
                first_name=base_user.first_name,
                last_name=base_user.last_name,
                username=base_user.username,
                email=base_user.email,
                roles=[r.name for r in user_roles],
                institution=institution.name if institution else None,
            )
        except Exception:
            raise ValueError("Failed to get user data")

    async def get_user_role(self, id: ID) -> List[Role]:
        """Return all roles assigned to a user."""
        try:
            user = await self.get_user(id)
            if not user:
                raise ValueError("Failed to get user. User does not exist")
            logger.debug(f"Getting user roles {user.roles}")
            return user.roles
        except Exception as e:
            raise e

    async def get_user_inst(self, id: ID) -> Institution | None:
        """Return a user's institution if one is assigned."""
        try:
            user = await self.get_user(id)
            if not user:
                raise ValueError("Failed to get user. User does not exist")
            logger.debug("Getting user institution %s", user.institution)
            return user.institution
        except Exception as e:
            raise e

    async def _resolve_user(self, user: ID | User) -> User:
        """Resolve a user model from either a user object or user ID."""
        if isinstance(user, ID):
            user_orm = await self.get_user(user)
            if not user_orm:
                raise ValueError(f"User '{user}' not found")
        else:
            user_orm = user
        return user_orm
