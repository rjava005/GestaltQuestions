import pytest
from pydantic import ValidationError
from src.model.users import User, UserCreate, UserUpdate
from src.data.user import UserDB
from src.core.logging import logger
from typing import Dict
from app_test.unit.shared import USERS, INVALID_USERS


@pytest.fixture
def make_user(user_db: UserDB):
    async def _make_user(**overrides) -> User:
        defaults = {
            "first_name": "Luciano",
            "last_name": "Bermudez",
            "username": "luci123",
            "email": "luci123@email.com",
            "password": "1234",
        }

        data = UserCreate(**(defaults | overrides))  # type: ignore
        user = await user_db.create_user(data)

        assert user is not None
        return user

    return _make_user


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", USERS)
async def test_user_create(make_user, user_data: Dict[str, str]):
    user = await make_user(**user_data)
    logger.info("Created user %s", user)
    assert user


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", INVALID_USERS)
async def test_user_create_invalid_data_raises(make_user, user_data: Dict[str, str]):
    with pytest.raises(ValidationError):
        await make_user(**user_data)


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", USERS)
async def test_get_user(user_db, make_user, user_data: Dict[str, str]):
    cuser = await make_user(**user_data)
    ruser = await user_db.get_user(cuser.id)
    assert ruser
    assert cuser == ruser


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", USERS)
async def test_get_user_by_email(make_user, user_db, user_data: Dict[str, str]):
    cuser = await make_user(**user_data)
    ruser = await user_db.get_user_by_email(cuser.email)
    assert cuser == ruser


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", USERS)
async def test_delete_user(make_user, user_db, user_data: Dict[str, str]):
    cuser = await make_user(**user_data)
    await user_db.delete_user(cuser.id)
    ruser = await user_db.get_user(cuser.id)
    assert ruser is None


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", USERS)
async def test_update_user(make_user, user_db, user_data: Dict[str, str]):
    update_data = UserUpdate(
        username="My new username",
        email="newEmail@gmail.com",
    )
    cuser = await make_user(**user_data)
    update = await user_db.update_user(
        cuser.id,
        data=update_data,
    )
    assert update
    assert update.id == cuser.id
    logger.debug("This is the created user", update)
