import pytest
import src.api.database.user as user_db
import src.api.database.role as role_db
import src.api.database.institution as instituion_db
from app_test.mock_data import USERS
from src.api.core import logger
from src.api.database.models.users import (
    UserRoles,
    UserUpdate,
    ValidInstitutions,
)


user_data = {
    "first_name": "Luciano",
    "last_name": "Bermudez",
    "username": "luci123",
    "email": "luci123@gmail.com",
    "fb_id": "1234",
}


def test_user_create(make_user):
    user = make_user()
    user.role
    assert user


def test_get_user(make_user, db_session):
    cuser = make_user()
    ruser = user_db.get_user(cuser.id, db_session)
    assert ruser
    assert cuser == ruser


def test_get_user_by_email(make_user, db_session):
    cuser = make_user()
    ruser = user_db.get_user_by_email(cuser.email, db_session)
    assert cuser == ruser


def test_get_user_by_fb(make_user, db_session):
    cuser = make_user()
    ruser = user_db.get_user_by_fb(cuser.fb_id, db_session)
    assert cuser == ruser


def test_delete_user(make_user, db_session):
    cuser = make_user()
    user_db.delete_user(cuser.id, db_session)
    ruser = user_db.get_user(cuser.id, db_session)
    assert ruser is None


def test_update_user(make_user, db_session):
    update_data = UserUpdate(
        username="My new username",
        email="newEmail@gmail.com",
    )
    cuser = make_user()
    update = user_db.update_user(cuser.id, data=update_data, session=db_session)
    assert update
    assert update.id == cuser.id
    logger.debug("This is the created user", update)


@pytest.mark.asyncio
async def test_set_user_question(make_user, make_question, db_session):
    qcreated = await make_question()
    user = make_user()
    user_db.set_user_created_questions(user.id, qcreated, db_session)
    result = user_db.get_user_created_questions(user.id, db_session)
    assert result


@pytest.mark.asyncio
async def test_set_user_questions(make_user, make_question, db_session):
    user = make_user()
    for _ in range(3):
        qcreated = await make_question()
        user_db.set_user_created_questions(user.id, qcreated, db_session)
    result = user_db.get_user_created_questions(user.id, db_session)

    logger.debug(f"These are the results {result}")
    assert result
    assert len(result) == 3


@pytest.mark.parametrize(
    "role", [UserRoles.ADMIN, UserRoles.DEVELOPER, UserRoles.STUDENT, UserRoles.TEACHER]
)
def test_set_user_role(make_user, role, db_session):
    r = role_db.create_role(db_session, role, "")
    user = make_user()
    assert r
    user = user_db.set_user_role(user.id, role, db_session)
    assert user
    assert user.role.name == role.value


@pytest.mark.parametrize(
    "institution",
    [ValidInstitutions.CPP, ValidInstitutions.NORCO, ValidInstitutions.UCR],
)
def test_set_user_institution(make_user, institution, db_session):
    inst = instituion_db.create_institution(db_session, institution)
    assert inst
    user = make_user()
    user = user_db.set_user_institution(user.id, institution, db_session)
    logger.debug(f"This is the returned user {user}")
    assert user
    assert user.institution.name == institution.value  # type: ignore
    assert user.institution_id == inst.id


@pytest.mark.parametrize(
    "institution",
    [ValidInstitutions.CPP, ValidInstitutions.NORCO, ValidInstitutions.UCR, None],
)
@pytest.mark.parametrize(
    "role", [UserRoles.ADMIN, UserRoles.DEVELOPER, UserRoles.STUDENT, UserRoles.TEACHER]
)
@pytest.mark.parametrize("user_data", USERS)
def test_make_user_full(institution, role, user_data, db_session):
    # Create the institution and role
    if institution:
        inst = instituion_db.create_institution(db_session, institution)
        assert inst
    r = role_db.create_role(db_session, role, "")

    assert r
    user = user_db.create_user_full(user_data, db_session, role, institution)
    assert user
    if institution:
        assert user.institution.name == institution.value  # type: ignore
    assert user.role.name == role.value
