import pytest
from src.model.users import  Role
from src.types import UserRoles
from src.core import logger

@pytest.mark.asyncio
async def test_create_role(role_manager):
    r = await role_manager.create_role(UserRoles.ADMIN)
    logger.info("Created role %s", r)
    assert r
    assert isinstance(r, Role)


@pytest.mark.asyncio
async def test_does_role_exist(role_manager):
    # Create the role
    r = await role_manager.create_role(UserRoles.ADMIN)
    assert await role_manager.does_role_exist(UserRoles.ADMIN)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "role", [UserRoles.ADMIN, UserRoles.DEVELOPER, UserRoles.STUDENT, UserRoles.TEACHER]
)
async def test_set_user_role(make_user, role_manager, user_db, role):
    r = await role_manager.create_role(role, "")
    assert r
    user = await make_user()
    
    user = await user_db.set_user_role(user.id, role)
    assert user
    assert user.role.name == role.value
