import asyncio
from uuid import uuid4

import pytest
from firebase_admin import auth

from backend.auth import UserInstResponse, UserRead, UserRoles, ValidInstitutions


@pytest.fixture
def make_user_payload():
    def _make_user_payload(
        role=UserRoles.STUDENT.value,
        institution=None,
        include_role=True,
    ):
        unique = uuid4().hex
        payload = {
            "user": {
                "first_name": "Ada",
                "last_name": "Lovelace",
                "username": f"ada_{unique}",
                "password": "test-password-123",
                "email": f"ada_{unique}@example.com",
            },
            "institution": institution,
        }

        if include_role:
            payload["role"] = role

        return payload

    return _make_user_payload


@pytest.fixture
def user_payload(make_user_payload):
    return make_user_payload()


def _get_user_by_email(user_manager, email: str):
    return asyncio.run(user_manager.get_user_by_email(email))


@pytest.mark.usefixtures("firebase_app_for_tests")
@pytest.mark.parametrize(
    ("role", "institution"),
    [
        (UserRoles.STUDENT.value, None),
        (UserRoles.DEVELOPER.value, ValidInstitutions.CPP.value),
        (UserRoles.TEACHER.value, ValidInstitutions.NORCO.value),
    ],
)
def test_create_user_with_role_and_institution(
    api_client, user_manager, make_user_payload, role, institution
):
    user_payload = make_user_payload(role=role, institution=institution)

    response = api_client.post("/users/", json=user_payload)

    assert response.status_code == 200
    data = response.json()
    UserRead.model_validate(data)

    assert data == {
        "first_name": user_payload["user"]["first_name"],
        "last_name": user_payload["user"]["last_name"],
        "username": user_payload["user"]["username"],
        "email": user_payload["user"]["email"],
        "roles": [role],
        "institution": institution,
    }

    user = _get_user_by_email(user_manager, user_payload["user"]["email"])
    assert user is not None
    assert [user_role.name for user_role in user.roles] == [role]
    assert (user.institution.name if user.institution else None) == institution
    auth.delete_user(str(user.id))


@pytest.mark.usefixtures("firebase_app_for_tests")
def test_create_user_defaults_to_student_role_when_role_is_omitted(
    api_client, user_manager, make_user_payload
):
    user_payload = make_user_payload(include_role=False)

    response = api_client.post("/users/", json=user_payload)

    assert response.status_code == 200
    data = response.json()
    UserRead.model_validate(data)

    assert data["roles"] == [UserRoles.STUDENT.value]

    user = _get_user_by_email(user_manager, user_payload["user"]["email"])
    assert user is not None
    assert [role.name for role in user.roles] == [UserRoles.STUDENT.value]
    auth.delete_user(str(user.id))


@pytest.mark.usefixtures("firebase_app_for_tests")
def test_get_user_roles_by_id_returns_assigned_roles(
    api_client, user_manager, user_payload
):
    create_response = api_client.post("/users/", json=user_payload)
    assert create_response.status_code == 200

    user = _get_user_by_email(user_manager, user_payload["user"]["email"])
    assert user is not None

    add_role_response = api_client.post(
        f"/users/{user.id}/roles",
        json={"role": UserRoles.DEVELOPER.value},
    )
    assert add_role_response.status_code == 200

    response = api_client.get(f"/users/{user.id}/roles")

    assert response.status_code == 200
    data = response.json()
    UserRead.model_validate(data)

    assert data["email"] == user_payload["user"]["email"]
    assert set(data["roles"]) == {
        UserRoles.STUDENT.value,
        UserRoles.DEVELOPER.value,
    }

    auth.delete_user(str(user.id))


@pytest.mark.usefixtures("firebase_app_for_tests")
def test_get_user_institution_by_id_returns_user_and_institution(
    api_client, user_manager, user_payload
):
    user_payload["institution"] = ValidInstitutions.CPP.value
    create_response = api_client.post("/users/", json=user_payload)
    assert create_response.status_code == 200

    user = _get_user_by_email(user_manager, user_payload["user"]["email"])
    assert user is not None

    response = api_client.get(f"/users/{user.id}/institution")

    assert response.status_code == 200
    data = response.json()
    UserInstResponse.model_validate(data)

    assert data["user"]["email"] == user_payload["user"]["email"]
    assert data["user"]["institution"] == ValidInstitutions.CPP.value
    assert data["inst"]["name"] == ValidInstitutions.CPP.value

    auth.delete_user(str(user.id))


@pytest.mark.usefixtures("firebase_app_for_tests")
def test_add_user_role_response_model(api_client, user_manager, user_payload):
    create_response = api_client.post("/users/", json=user_payload)
    assert create_response.status_code == 200

    user = _get_user_by_email(user_manager, user_payload["user"]["email"])
    assert user is not None

    response = api_client.post(
        f"/users/{user.id}/roles",
        json={"role": UserRoles.DEVELOPER.value},
    )

    assert response.status_code == 200
    data = response.json()
    UserRead.model_validate(data)

    assert data["email"] == user_payload["user"]["email"]
    assert UserRoles.STUDENT.value in data["roles"]
    assert UserRoles.DEVELOPER.value in data["roles"]

    auth.delete_user(str(user.id))


def test_get_user_roles_not_found_response(api_client):
    response = api_client.get(f"/users/{uuid4()}/roles")

    assert response.status_code == 404
    assert response.json()["detail"]
