import pytest

from src.model.users import Role, UserRoles


TEST_ROLES = [UserRoles.ADMIN, UserRoles.STUDENT, UserRoles.DEVELOPER]


@pytest.mark.asyncio
@pytest.mark.parametrize("role", TEST_ROLES)
async def test_create_role(role_manager, role):
    created = await role_manager.create_role(role)

    assert created is not None
    assert isinstance(created, Role)
    assert created.name == role.value


@pytest.mark.asyncio
@pytest.mark.parametrize("role", TEST_ROLES)
async def test_does_role_exist(role_manager, role):
    assert await role_manager.does_role_exist(role) is False

    await role_manager.create_role(role)

    assert await role_manager.does_role_exist(role) is True


@pytest.mark.asyncio
@pytest.mark.parametrize("role", TEST_ROLES)
async def test_get_role(role_manager, role):
    await role_manager.create_role(role)

    found = await role_manager.get_role(role)

    assert found is not None
    assert found.name == role.value


@pytest.mark.asyncio
@pytest.mark.parametrize("role", TEST_ROLES)
async def test_get_role_data(role_manager, role):
    await role_manager.create_role(role)

    found = await role_manager.get_role_data(role.value)

    assert found is not None
    assert found.name == role.value


@pytest.mark.asyncio
async def test_seed_roles(role_manager):
    await role_manager.seed_roles()

    for role in UserRoles:
        assert await role_manager.does_role_exist(role) is True
