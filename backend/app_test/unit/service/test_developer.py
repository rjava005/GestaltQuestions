from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.model.users import DeveloperProfile, UserRoles
from src.service.question_manager.developer_question_service import (
    AccessDecision,
    DeveloperAccessDenied,
    DeveloperAccessService,
)


@pytest.fixture
def mocked_user_manager():
    manager = MagicMock()
    manager.get_user = AsyncMock()
    manager.get_user_role = AsyncMock()
    manager.get_user_inst = AsyncMock()
    return manager


@pytest.fixture
def mocked_storage():
    storage = MagicMock()
    storage.create_dir = MagicMock()
    return storage


@pytest.fixture
def developer_service(db_session, mocked_user_manager, mocked_storage):
    return DeveloperAccessService(
        user_manager=mocked_user_manager,
        storage=mocked_storage,
        session=db_session,
    )


@pytest.mark.asyncio
async def test_has_developer_role_returns_false_when_user_missing(
    developer_service: DeveloperAccessService,
    mocked_user_manager,
) -> None:
    mocked_user_manager.get_user.return_value = None
    result = await developer_service.has_developer_role("user-123")
    assert result.allowed is False
    assert result.reason == "User 'user-123' not found"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "role_name", [UserRoles.DEVELOPER.value, UserRoles.ADMIN.value]
)
async def test_has_developer_role_allows_developer_and_admin(
    developer_service: DeveloperAccessService,
    mocked_user_manager,
    role_name: str,
) -> None:
    mocked_user_manager.get_user.return_value = SimpleNamespace(id="user-123")
    mocked_user_manager.get_user_role.return_value = [SimpleNamespace(name=role_name)]

    result = await developer_service.has_developer_role("user-123")

    assert result.allowed is True
    assert result.reason == "Developer access granted"


@pytest.mark.asyncio
async def test_require_developer_access_raises_when_role_missing(
    developer_service: DeveloperAccessService,
    mocked_user_manager,
) -> None:
    mocked_user_manager.get_user.return_value = SimpleNamespace(id="user-123")
    mocked_user_manager.get_user_role.return_value = [
        SimpleNamespace(name=UserRoles.STUDENT.value)
    ]

    with pytest.raises(DeveloperAccessDenied, match="Developer role is required"):
        await developer_service.require_developer_access("user-123")


@pytest.mark.asyncio
async def test_generate_storage_path_uses_institution_slug(
    developer_service: DeveloperAccessService,
    mocked_user_manager,
) -> None:
    mocked_user_manager.get_user.return_value = SimpleNamespace(id="abc-123")
    mocked_user_manager.get_user_inst.return_value = SimpleNamespace(
        name="Cool School @ West"
    )
    path = await developer_service.generate_storage_path("abc-123")

    assert path == "cool_school_west/developers/abc-123/"


@pytest.mark.asyncio
async def test_generate_storage_path_falls_back_when_institution_missing(
    developer_service: DeveloperAccessService,
    mocked_user_manager,
) -> None:
    mocked_user_manager.get_user.return_value = SimpleNamespace(id="abc-123")
    mocked_user_manager.get_user_inst.return_value = None

    path = await developer_service.generate_storage_path("abc-123")

    assert path == "untitled_institution/developers/abc-123/"


@pytest.mark.asyncio
async def test_set_developer_data_creates_profile_with_storage_path(
    developer_service: DeveloperAccessService,
    mocked_user_manager,
    db_session,
) -> None:
    user_id = uuid4()
    mocked_user_manager.get_user.return_value = SimpleNamespace(id=user_id)
    mocked_user_manager.get_user_role.return_value = [
        SimpleNamespace(name=UserRoles.DEVELOPER.value)
    ]
    mocked_user_manager.get_user_inst.return_value = SimpleNamespace(name="CPP")

    profile = await developer_service.set_developer_data(user_id)

    assert isinstance(profile, DeveloperProfile)
    assert str(profile.user_id) == str(user_id)
    assert profile.storage_path == f"cpp/developers/{user_id}/"


@pytest.mark.asyncio
async def test_get_developer_data_returns_existing_profile(
    developer_service: DeveloperAccessService,
    mocked_user_manager,
    db_session,
) -> None:
    user_id = uuid4()
    mocked_user_manager.get_user.return_value = SimpleNamespace(id=user_id)
    mocked_user_manager.get_user_role.return_value = [
        SimpleNamespace(name=UserRoles.DEVELOPER.value)
    ]

    profile = DeveloperProfile(
        user_id=user_id,
        storage_path="cpp/developers/abc-123/",
    )
    db_session.add(profile)
    db_session.commit()

    result = await developer_service.get_developer_data(user_id)

    assert result is not None
    assert result.storage_path == "cpp/developers/abc-123/"
