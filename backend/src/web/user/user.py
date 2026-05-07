from fastapi import APIRouter, HTTPException
from firebase_admin import auth
from pydantic import BaseModel
import src.service.user
from starlette import status

from src.app_types.general import ID
from src.core.logging import logger
from src.model.users import (
    CreateUserFullPayload,
    UpdateUserInstitution,
    UpdateUserRole,
    User,
    UserInstResponse,
    UserRead,
    UserRoleResponse,
)
from .dependencies import UserManagerDependeny, FireBaseToken, CurrentUser
from src.service.user.user_manager import UserNotFound

router = APIRouter(prefix="/users", tags=["users"])


class LoginRequest(BaseModel):
    id_token: str


@router.post("/")
async def create_user(
    user_manager: UserManagerDependeny,
    payload: CreateUserFullPayload,
):
    try:
        logger.debug("Attempting to create user")
        created_user = await user_manager.create_user(
            data=payload.user, role=payload.role, institution=payload.institution
        )
        return created_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occured while creating the user {e}",
        )


@router.get("/")
async def get_user(
    user_manager: UserManagerDependeny, current_user: CurrentUser
) -> UserRead:
    try:
        return await user_manager.read_user(current_user)
    except UserNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information",
        )


@router.post("/login")
async def login(payload: LoginRequest):
    decoded = auth.verify_id_token(payload.id_token)
    user_read = UserRead(
        email=decoded.get("email", None),
    )
    return user_read


@router.post("/get_current_user")
def get_current_user(
    token: FireBaseToken,
) -> UserRead:
    decoded = token
    user_read = UserRead(email=decoded.get("email", None))
    return user_read


# ---------- ID-based user management
# These endpoints operate directly on internal user IDs and are intended for
# service/admin workflows rather than frontend token-based self-service paths.


@router.get("/{id}")
async def get_user_by_id(user_manager: UserManagerDependeny, id: ID) -> User | None:
    """
    Retrieve a user by internal ID.

    This endpoint is intended for backend/admin flows where user IDs are
    already known.
    """
    try:
        user = await user_manager.get_user(id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{id}' not found",
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to retrieve user by id='%s'", id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user '{id}': {e}",
        )


@router.delete("/{id}")
async def delete_user_by_id(user_manager: UserManagerDependeny, id: ID):
    """
    Delete a user by internal ID.

    This endpoint is intended for backend/admin flows.
    """
    try:
        user = await user_manager.get_user(id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{id}' not found",
            )
        await user_manager.delete_user(id)
        return {"detail": "user deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to delete user id='%s'", id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user '{id}': {e}",
        )


@router.get("/{id}/roles")
async def get_user_roles_by_id(
    user_manager: UserManagerDependeny, id: ID
) -> UserRoleResponse:
    """
    Retrieve all roles for a user by internal ID.

    This endpoint is intended for backend/admin flows.
    """
    try:
        user = await user_manager.get_user(id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{id}' not found",
            )
        roles = await user_manager.get_user_role(id)
        return UserRoleResponse(user=user, roles=roles)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to retrieve roles for user id='%s'", id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve roles for user '{id}': {e}",
        )


@router.post("/{id}/roles")
async def add_user_role(
    user_manager: UserManagerDependeny, id: ID, payload: UpdateUserRole
) -> UserRoleResponse:
    """
    Add a role to a user by internal ID and return the updated role set.

    This endpoint is intended for backend/admin flows.
    """
    try:
        user_record = await user_manager.get_user(id)
        if user_record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{id}' not found",
            )
        user = await user_manager.add_role_to_user(role=payload.role, user=id)
        roles = await user_manager.get_user_role(id)
        return UserRoleResponse(user=user, roles=roles)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role update for user '{id}': {e}",
        )
    except Exception as e:
        logger.exception("Failed to add role '%s' to user id='%s'", payload.role, id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add role for user '{id}': {e}",
        )


@router.get("/{id}/institution")
async def get_institution_by_id(
    user_manager: UserManagerDependeny, id: ID
) -> UserInstResponse:
    """
    Retrieve the institution for a user by internal ID.

    This endpoint is intended for backend/admin flows.
    """
    try:
        user = await user_manager.get_user(id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{id}' not found",
            )
        inst = await user_manager.get_user_inst(id)
        return UserInstResponse(user=user, inst=inst)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to retrieve institution for user id='%s'", id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve institution for user '{id}': {e}",
        )


@router.post("/{id}/institution")
async def add_user_inst(
    user_manager: UserManagerDependeny, id: ID, payload: UpdateUserInstitution
) -> UserInstResponse:
    """
    Set a user's institution by internal ID and return the updated institution.

    This endpoint is intended for backend/admin flows.
    """
    try:
        user_record = await user_manager.get_user(id)
        if user_record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{id}' not found",
            )
        user = await user_manager.set_user_institution(
            institution=payload.institution, user=id
        )
        inst = await user_manager.get_user_inst(id)
        return UserInstResponse(user=user, inst=inst)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid institution update for user '{id}': {e}",
        )
    except Exception as e:
        logger.exception(
            "Failed to set institution '%s' for user id='%s'",
            payload.institution,
            id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set institution for user '{id}': {e}",
        )
