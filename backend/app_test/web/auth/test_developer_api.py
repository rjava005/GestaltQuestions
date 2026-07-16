import asyncio
from uuid import uuid4

from sqlmodel import select

from backend.auth import (
    DeveloperProfile,
    UserCreate,
    UserRead,
    UserRoles,
    ValidInstitutions,
)


def test_add_developer_role_then_set_profile(api_client, user_manager, db_session):
    unique = uuid4().hex
    user = asyncio.run(
        user_manager.udb.create_user(
            UserCreate(
                first_name="Grace",
                last_name="Hopper",
                username=f"grace_{unique}",
                password="test-password-123",
                email=f"grace_{unique}@example.com",
            )
        )
    )
    asyncio.run(user_manager.set_user_institution(ValidInstitutions.CPP, user))

    role_response = api_client.post(f"/users/dev/{user.id}/role")

    assert role_response.status_code == 200
    role_data = role_response.json()
    UserRead.model_validate(role_data)
    assert UserRoles.DEVELOPER.value in role_data["roles"]

    profile_response = api_client.post(f"/users/dev/{user.id}")

    assert profile_response.status_code == 200
    profile_data = profile_response.json()
    assert profile_data["user_id"] == str(user.id)
    assert (
        profile_data["storage_path"]
        == f"california_state_polytechnic_university_pomona/developers/{user.id}/"
    )

    stored_profile = db_session.exec(
        select(DeveloperProfile).where(DeveloperProfile.user_id == user.id)
    ).first()
    assert stored_profile is not None
    assert stored_profile.storage_path == profile_data["storage_path"]
