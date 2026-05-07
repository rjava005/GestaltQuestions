from .dependencies import CurrentUser, DeveloperAccess
from fastapi import APIRouter, HTTPException
from starlette import status

from src.core.logging import logger
from src.service.user.exceptions import DeveloperProfileNotSet

router = APIRouter(prefix="/users/dev", tags=["users", "developer"])


@router.post("/")
async def check_status(dev_access: DeveloperAccess, current_user: CurrentUser):
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
