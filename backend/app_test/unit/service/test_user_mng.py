import pytest

from app_test.unit.shared import USERS
from backend.auth import (
    User,
    UserCreate,
    UserCreateError,
    UserManager,
    UserRoles,
    ValidInstitutions,
)
from backend.auth.services import user_manager as user_manager_module


@pytest.fixture
def seed_institution(institution_db):
    async def _seed(institution: ValidInstitutions = ValidInstitutions.CPP):
        return await institution_db.create_institution(institution)

    return _seed


@pytest.fixture
def user_mng(
    monkeypatch: pytest.MonkeyPatch, db_session, role_manager, institution_db, user_db
) -> UserManager:
    def fake_auth(email: str, display_name: str, uid: str, password: str):
        return {
            "email": email,
            "display_name": display_name,
            "uid": uid,
            "password": password,
        }

    monkeypatch.setattr(user_manager_module.auth, "create_user", fake_auth)
    return UserManager(
        udb=user_db,
        rm=role_manager,
        inst=institution_db,
        session=db_session,
    )


@pytest.fixture
def make_user(user_mng: UserManager):
    async def _make_user(**overrides) -> User:
        defaults = {
            "first_name": "Luciano",
            "last_name": "Bermudez",
            "username": "luci123",
            "email": "luci123@email.com",
            "password": "1234",
        }
        data = UserCreate(**(defaults | overrides))
        user = await user_mng.create_user(data)
        assert user is not None
        return user

    return _make_user


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", USERS)
async def test_create_user_assigns_default_student_role(
    make_user, user_data, seed_roles
) -> None:
    user = await make_user(**user_data)

    assert user
    role_names = [role.name for role in user.roles]
    assert UserRoles.STUDENT.value in role_names


@pytest.mark.asyncio
@pytest.mark.parametrize("user_data", USERS)
async def test_create_user_auth_failed(
    make_user, user_mng: UserManager, user_data, seed_roles, monkeypatch
) -> None:
    def fake_auth(*args, **kwargs) -> bool:
        return False  # triggers assert response failure

    monkeypatch.setattr(user_manager_module.auth, "create_user", fake_auth)

    with pytest.raises(UserCreateError) as exc_info:
        await make_user(**user_data)

    assert "Failed to create user" in str(exc_info.value)


@pytest.mark.asyncio
async def test_add_role_to_user_does_not_duplicate_role(
    make_user, seed_roles, user_mng
) -> None:
    user = await make_user()

    updated = await user_mng.add_role_to_user(UserRoles.STUDENT, user)
    role_names = [role.name for role in updated.roles]

    assert role_names.count(UserRoles.STUDENT.value) == 1


@pytest.mark.asyncio
async def test_set_user_institution_by_id(
    make_user, seed_roles, seed_institution, user_mng
) -> None:
    await seed_institution(ValidInstitutions.CPP)
    user = await make_user()

    updated = await user_mng.set_user_institution(ValidInstitutions.CPP, user.id)

    assert updated.institution is not None
    assert updated.institution.name == ValidInstitutions.CPP


@pytest.mark.asyncio
async def test_delete_user_removes_db_user_and_calls_firebase(
    make_user, seed_roles, user_mng, monkeypatch
) -> None:
    deleted = {}

    def fake_delete_user(uid) -> None:
        deleted["uid"] = uid

    monkeypatch.setattr(user_manager_module.auth, "delete_user", fake_delete_user)

    user = await make_user()
    await user_mng.delete_user(user.id)

    assert await user_mng.get_user(user.id) is None
    assert deleted["uid"] == user.id
