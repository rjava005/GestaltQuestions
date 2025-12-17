# --- Third-Party ---
from fastapi import APIRouter

# --- Internal ---
from pydantic import BaseModel
from src.api.db_models.users import User
from src.api.service.user_manager import UserManagerDependeny
from src.api.core.logging import logger
from src.api.dependencies import FireBaseToken
from fastapi import HTTPException
from starlette import status
from src.api.initialize_firebase import initialize_firebase_app
from src.api.db_models.users import (
    User,
    UserBase,
    UserRoles,
    ValidInstitutions,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])
initialize_firebase_app()


class CreateUserFullPayload(BaseModel):
    user: UserBase
    institution: ValidInstitutions | None = None


@router.post("/")
async def create_user(
    user_manager: UserManagerDependeny,
    fb_token: FireBaseToken,
    data: UserBase,
) -> User:
    """
    Create a new user in the system.

    Args:
        user_manager (UserManagerDependeny): Dependency providing user management operations.
        data (UserBase): Incoming user registration data (email, fb_id, etc.).

    Returns:
        User: The newly created user object.
    """

    # Check if the user already exist in the database
    try:
        fb_uid = fb_token["uid"]
        existing_user = user_manager.get_user_by_fb(fb_uid)
        if existing_user:
            logger.info(f"[DB] User already exists: {existing_user.fb_id}")
            return existing_user
        # Other wise create a user
        logger.info(
            "Creating user with email='%s' and fb_id='%s'",
            data.email,
        )

        data.fb_id = fb_uid
        created_user = user_manager.create_user(data)

        logger.info("User created successfully: uid='%s'", created_user.id)
        return created_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occured while creating the user {e}",
        )


@router.post("/full")
def create_user_full(
    user_manager: UserManagerDependeny,
    fb_token: FireBaseToken,
    payload: CreateUserFullPayload,
    role: UserRoles = UserRoles.STUDENT,
):
    try:
        fb_uid = fb_token["uid"]
        existing_user = user_manager.get_user_by_fb(fb_uid)
        if existing_user:
            logger.info(f"[DB] User already exists: {existing_user.fb_id}")
            return existing_user
        # Other wise create a user
        logger.info(
            "Creating user with email='%s' and fb_id='%s'",
            payload.user.email,
        )
        payload.user.fb_id = fb_uid
        created_user = user_manager.create_user_full(
            payload.user, role, payload.institution
        )
        logger.info("User created successfully: uid='%s'", created_user.id)
        return created_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occured while creating the user {e}",
        )


@router.get("/{id}")
async def get_user_by_id(user_manager: UserManagerDependeny, id: str) -> User:
    try:
        return user_manager.get_user(id)
    except Exception:
        raise


@router.get("/")
async def get_user(
    user_manager: UserManagerDependeny,
    token: FireBaseToken,
) -> User:
    """
    Retrieve a user by their unique ID.

    Args:
        user_manager (UserManagerDependeny): User management service.
        id (str): The user ID to retrieve.

    Returns:
        User: The user with the specified ID.
    """
    try:
        user = user_manager.get_user_by_fb(token["uid"])
        logger.info("Retrieved user: uid='%s', email='%s'", user.id, user.email)
        return user
    except HTTPException as e:
        logger.error(f"[DB] User not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get user {e}",
        )


@router.delete("/")
async def delete_user(
    user_manager: UserManagerDependeny,
    token: FireBaseToken,
):
    """
    Delete a user by their ID.

    Args:
        user_manager (UserManagerDependeny): User management service.
        id (str): User ID to delete.

    Returns:
        dict: Success message.
    """
    logger.warning("Deleting user with id='%s'", id)
    user = user_manager.get_user_by_fb(token["uid"])
    assert user.id

    user_manager.delete_user(user.id)

    logger.info("User successfully deleted: id='%s'", id)
    return {"detail": "user deleted"}


@router.put("/")
async def update_user(
    user_manager: UserManagerDependeny,
    token: FireBaseToken,
    data: UserUpdate,
) -> User:
    """
    Update an existing user's information.

    Args:
        user_manager (UserManagerDependeny): User service handler.
        id (str): ID of the user to update.
        data (UserBase): Updated user information.

    Returns:
        User: The updated user object.
    """
    user = user_manager.get_user_by_fb(token["uid"])
    updated_user = user_manager.update_user(user.id, data)
    logger.info("User updated successfully: id='%s'", id)
    return updated_user
