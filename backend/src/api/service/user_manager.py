from typing import Annotated, Sequence
from uuid import UUID
from src.api.core import logger
from fastapi import Depends, HTTPException
from starlette import status

from src.api.database.database import SessionDep
from src.api.database import user as udb
from src.api.db_models.users import (
    User,
    UserBase,
    UserRoles,
    ValidInstitutions,
    UserUpdate,
)


class UserManager:
    def __init__(self, session: SessionDep):
        self.session = session

    def create_user(self, data: UserBase) -> User:
        try:
            user = udb.create_user(data, self.session)
            assert user
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not create user {e}",
            )

    def create_user_full(
        self,
        data: UserBase,
        role: UserRoles = UserRoles.STUDENT,
        institution: ValidInstitutions | None = None,
    ) -> User:
        try:
            user = udb.create_user_full(data, self.session, role, institution)
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create user {e}",
            )

    def get_user(self, id: str | UUID) -> User:
        try:
            user = udb.get_user(id, self.session)
            assert user
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not retrieve user {e}",
            )

    def get_user_by_email(self, email) -> User:
        try:
            user = udb.get_user_by_email(email, self.session)
            assert user
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not retrieve user by email {e}",
            )

    def get_user_by_fb(self, uid: str) -> User:
        try:
            user = udb.get_user_by_fb(uid, self.session)
            assert user
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"user not found  {e}",
            )

    def get_all_users(self, offset: int, limit: int) -> Sequence[User]:
        try:
            return udb.get_all_users(self.session, offset, limit)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not retreive all users",
            )

    def delete_user(self, id: str | UUID) -> bool:
        try:
            udb.delete_user(id, self.session)
            return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not delete user {e}",
            )

    def update_user(self, id: str | UUID, data: UserUpdate) -> User:
        try:
            user = udb.update_user(id, data, self.session)
            assert user
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not update user {e}",
            )

    def set_user_role(self, id: str | UUID, role: UserRoles) -> User:
        try:
            return udb.set_user_role(id, role, self.session)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to set user role {e}",
            )

    def set_user_institution(self, id: str | UUID, institution: ValidInstitutions):
        try:
            return udb.set_user_institution(id, institution, self.session)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to set institution to user",
            )


def get_user_manager(session: SessionDep) -> UserManager:
    return UserManager(session)


UserManagerDependeny = Annotated[UserManager, Depends(get_user_manager)]
