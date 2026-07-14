import re
from dataclasses import dataclass

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from backend.auth.exceptions import (
    DeveloperAccessDenied,
    DeveloperProfileError,
    DeveloperProfileNotSet,
    DeveloperStoragePathError,
)
from backend.auth.model import DeveloperProfile
from backend.auth.schemas import UserRoles
from backend.core import logger
from backend.shared.schema import ID
from backend.storage.services import Storage
from backend.utils import convert_uuid

from .user_manager import UserManager


@dataclass
class AccessDecision:
    allowed: bool
    reason: str


class DeveloperAccessService:
    def __init__(
        self, user_manager: UserManager, storage: Storage, session: Session
    ) -> None:
        self.user_mng = user_manager
        self.session = session

        self.storage = storage

    # Role Validation
    # ------------------------------------------------------------------

    async def has_developer_role(self, user_id: ID) -> AccessDecision:
        """Return whether the user has admin or developer privileges."""
        logger.debug("Checking developer role for user %s", user_id)
        try:
            user = await self.user_mng.get_user(user_id)
            if user is None:
                logger.warning(
                    "Developer role check failed: user %s not found", user_id
                )
                return AccessDecision(False, f"User '{user_id}' not found")

            roles = await self.user_mng.get_user_role(user_id)
            role_names = {r.name.strip().lower() for r in roles}
            if (
                UserRoles.ADMIN.value in role_names
                or UserRoles.DEVELOPER.value in role_names
            ):
                logger.debug("Developer access granted for user %s", user_id)
                return AccessDecision(True, "Developer access granted")

            logger.warning("Developer role required for user %s", user_id)
            return AccessDecision(
                False, "Developer role is required to perform this action"
            )
        except Exception as e:
            logger.warning("Failed checking developer role for user %s: %s", user_id, e)
            raise DeveloperAccessDenied(
                "Failed to determine developer role", user_id=str(user_id)
            ) from e

    async def require_developer_access(self, user_id: ID) -> None:
        """Raise when the user does not have developer-level access."""
        access = await self.has_developer_role(user_id)
        if not access.allowed:
            raise DeveloperAccessDenied(access.reason, user_id=str(user_id))

    async def get_developer_data(self, user_id: ID) -> DeveloperProfile | None:
        """Fetch the developer profile for a user after validating access."""
        await self.require_developer_access(user_id)
        try:
            logger.debug("Fetching developer profile for user %s", user_id)
            profile = self.session.exec(
                select(DeveloperProfile).where(
                    DeveloperProfile.user_id == convert_uuid(user_id)
                )
            ).first()
            if not profile:
                raise DeveloperProfileNotSet(
                    action="retrieve_developer_data",
                    user_id=str(user_id),
                    details=f"Developer {user_id} profile not complete must be set",
                )
            return profile
        except SQLAlchemyError as e:
            logger.warning("Failed fetching developer profile for user %s", user_id)
            raise DeveloperProfileError("retrieve", str(user_id), str(e)) from e

    async def set_developer_data(self, user_id: ID) -> DeveloperProfile:
        """Create or refresh the developer profile and its storage path."""
        try:
            await self.require_developer_access(user_id)
            storage_path = await self.generate_storage_path(user_id)
            logger.debug("Setting developer profile for user %s", user_id)

            dev_profile = self.session.exec(
                select(DeveloperProfile).where(
                    DeveloperProfile.user_id == convert_uuid(user_id)
                )
            ).first()

            if dev_profile is None:
                logger.info("Creating developer profile for user %s", user_id)
                dev_profile = DeveloperProfile(
                    user_id=convert_uuid(user_id), storage_path=storage_path
                )
                self.session.add(dev_profile)
            elif storage_path is not None:
                logger.debug("Updating developer storage path for user %s", user_id)
                dev_profile.storage_path = storage_path
                self.session.add(dev_profile)
                self.storage.create_dir(storage_path)

            self.session.commit()
            self.session.refresh(dev_profile)
            return dev_profile
        except DeveloperAccessDenied:
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.warning(
                "Database error setting developer profile for user %s", user_id
            )
            raise DeveloperProfileError("set up", str(user_id), str(e)) from e
        except Exception as e:
            logger.warning(
                "Failed setting developer profile for user %s: %s", user_id, e
            )
            raise DeveloperProfileError("set up", str(user_id), str(e)) from e

    async def generate_storage_path(self, id: ID) -> str:
        """Build the developer storage prefix from the user's institution and id."""
        user = await self.user_mng.get_user(id)
        if not user:
            raise DeveloperStoragePathError(
                "generate storage path", str(id), "User not found"
            )
        try:
            institution = await self.user_mng.get_user_inst(id)
        except Exception as e:
            raise DeveloperStoragePathError(
                "generate storage path", str(id), str(e)
            ) from e
        institution_name = (
            institution.name.value
            if institution and hasattr(institution.name, "value")
            else (institution.name if institution else "untitled_institution")
        )
        institution_slug = (
            re.sub(r"[^a-z0-9_-]+", "_", institution_name.lower()).strip("_")
            or "untitled_institution"
        )
        storage_path = f"{institution_slug}/developers/{user.id}/"
        logger.debug("Generated developer storage path for user %s", id)
        return storage_path
