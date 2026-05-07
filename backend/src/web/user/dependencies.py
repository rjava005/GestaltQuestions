from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin.auth import verify_id_token
from starlette import status

from src.data.institution import InstitutionDB
from src.data.role import RoleDB
from src.data.user import UserDB
from src.service.user.developer_access import DeveloperAccessService
from src.service.user.user_manager import UserManager
from src.web.dependencies import SessionDep, StorageDependency

bearer_scheme = HTTPBearer(auto_error=False)


def get_firebase_token(
    token: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict | None:
    try:
        if not token:
            raise ValueError("No Token")
        return verify_id_token(token.credentials)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Not logged in or Invalid credentials {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


FireBaseToken = Annotated[dict, Depends(get_firebase_token)]


def get_user_mng(session: SessionDep) -> UserManager:
    return UserManager(
        session=session,
        inst=InstitutionDB(session),
        rm=RoleDB(session),
        udb=UserDB(session),
    )


def get_current_user_id(
    token: FireBaseToken,
) -> str:
    try:
        user_id = token.get("user_id", None)
        if user_id is None:
            raise HTTPException(
                detail="Failed to retrieve signed in user",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            detail=f"Failed to retrieve signed in user {e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


UserManagerDependeny = Annotated[UserManager, Depends(get_user_mng)]
CurrentUser = Annotated[str, Depends(get_current_user_id)]


def get_developer_access(
    session: SessionDep, user_manager: UserManagerDependeny, storage: StorageDependency
) -> DeveloperAccessService:
    return DeveloperAccessService(
        user_manager=user_manager, storage=storage, session=session
    )


DeveloperAccess = Annotated[DeveloperAccessService, Depends(get_developer_access)]
