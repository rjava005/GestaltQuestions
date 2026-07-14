from fastapi import APIRouter
from starlette import status

from backend.api.deps import SettingDependency

router = APIRouter(tags=["health"])


@router.get("/startup", status_code=status.HTTP_200_OK)
def startup_connection():
    return {"message": "The API is LIVE!!"}


@router.get("/settings")
async def get_current_settings(settings: SettingDependency):
    """Return the current storage settings (cloud or local)."""
    return {"settings": settings}
