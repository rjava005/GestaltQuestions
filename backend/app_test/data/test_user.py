import pytest

from src.core import logger
from src.types import (
    UserUpdate,
)


@pytest.mark.asyncio
async def test_user_create(make_user):
    user = await make_user()
    logger.info("Created user %s", user)
    assert user


@pytest.mark.asyncio
async def test_get_user(user_db, make_user):
    cuser = await make_user()
    ruser = await user_db.get_user(cuser.id)
    assert ruser
    assert cuser == ruser


@pytest.mark.asyncio
async def test_get_user_by_email(make_user, user_db):
    cuser = await make_user()
    ruser = await user_db.get_user_by_email(cuser.email)
    assert cuser == ruser


@pytest.mark.asyncio
async def test_get_user_by_fb(make_user, user_db):
    cuser = await make_user()
    ruser = await user_db.get_user_by_token(cuser.fb_id)
    assert cuser == ruser


@pytest.mark.asyncio
async def test_delete_user(make_user, user_db):
    cuser = await make_user()
    await user_db.delete_user(cuser.id)
    ruser = await user_db.get_user(cuser.id)
    assert ruser is None


@pytest.mark.asyncio
async def test_update_user(make_user, user_db):
    update_data = UserUpdate(
        username="My new username",
        email="newEmail@gmail.com",
    )
    cuser = await make_user()
    update = await user_db.update_user(
        cuser.id,
        data=update_data,
    )
    assert update
    assert update.id == cuser.id
    logger.debug("This is the created user", update)
