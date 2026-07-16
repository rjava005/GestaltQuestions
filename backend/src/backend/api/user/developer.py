from fastapi import APIRouter, HTTPException
from starlette import status

from backend.api.deps import CurrentUser, DeveloperAccess, UserManagerDependeny
from backend.auth import DeveloperProfileNotSet, UserRead, UserRoles
from backend.core import logger
from backend.shared import ID

router = APIRouter(prefix="/users/dev", tags=["users", "developer"])


@router.post("/")
async def check_status(dev_access: DeveloperAccess, current_user: CurrentUser) -> None:
    access = await dev_access.has_developer_role(current_user)
    if not access.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not allowed {access.reason}",
        )


@router.get("/")
async def get_developer_profile(dev_access: DeveloperAccess, current_user: CurrentUser):
    try:
        return await dev_access.get_developer_data(current_user)
    except DeveloperProfileNotSet:
        logger.info(
            f"Current user {current_user} does not have profile set attempting to resolve"
        )
        return await dev_access.set_developer_data(current_user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e


@router.post("/{user_id}/role")
async def set_developer_role(
    user_manager: UserManagerDependeny, user_id: ID
) -> UserRead:
    try:
        user = await user_manager.add_role_to_user(UserRoles.DEVELOPER, user_id)
        return UserRead.from_model(user)
    except Exception as e:
        logger.exception("Failed to set developer role for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set developer role for user '{user_id}': {e}",
        ) from e


@router.post("/{user_id}")
async def set_developer_profile(
    dev_access: DeveloperAccess,
    user_manager: UserManagerDependeny,
    user_id: ID,
):
    try:
        await user_manager.add_role_to_user(UserRoles.DEVELOPER, user_id)
        profile = await dev_access.get_developer_data(user_id)
        if profile:
            return profile
        return await dev_access.set_developer_data(user_id)
    except DeveloperProfileNotSet:
        logger.info(
            f"Current user {user_id} does not have profile set attempting to resolve"
        )
        return await dev_access.set_developer_data(user_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
