import pytest
import src.api.database.user as user_db
import src.api.database.role as role_db
import src.api.database.institution as instituion_db
import src.api.database.question as question_db
from src.api.db_models.users import UserRoles, UserBase, UserUpdate, ValidInstitutions


@pytest.fixture
def user_data():
    return UserBase(
        first_name="Luciano",
        last_name="Bermudez",
        username="luci123",
        email="luci123@gmail.com",
        fb_id="1234",
    )


@pytest.fixture
def create_user(user_data, db_session):
    user = user_db.create_user(
        user_data,
        session=db_session,
    )
    return user


def test_user_create(create_user):
    user = create_user
    user.role
    assert user


def test_get_user(create_user, db_session):
    cuser = create_user
    ruser = user_db.get_user(cuser.id, db_session)
    assert ruser
    assert cuser == ruser


def test_get_user_by_email(create_user, user_data, db_session):
    cuser = create_user
    ruser = user_db.get_user_by_email(user_data.email, db_session)
    assert cuser == ruser


def test_get_user_by_fb(create_user, user_data, db_session):
    cuser = create_user
    ruser = user_db.get_user_by_fb(user_data.fb_id, db_session)
    assert cuser == ruser


def test_delete_user(create_user, db_session):
    cuser = create_user
    user_db.delete_user(cuser.id, db_session)
    ruser = user_db.get_user(cuser.id, db_session)
    assert ruser is None


def test_update_user(create_user, db_session):
    update_data = UserUpdate(
        username="My new username",
        email="newEmail@gmail.com",
    )
    cuser = create_user
    update = user_db.update_user(cuser.id, data=update_data, session=db_session)
    assert update
    assert update.id == cuser.id
    print("This is the created user", update)


@pytest.mark.asyncio
async def test_set_user_question(create_user, question_payload_full_dict, db_session):
    qcreated = await question_db.create_question(question_payload_full_dict, db_session)
    user_db.set_user_created_questions(create_user.id, qcreated, db_session)
    result = user_db.get_user_created_questions(create_user.id, db_session)
    print(f"These are the results {result}")
    assert result


@pytest.mark.asyncio
async def test_set_user_questions(create_user, question_payload_full_dict, db_session):
    for _ in range(3):
        qcreated = await question_db.create_question(
            question_payload_full_dict, db_session
        )
        user_db.set_user_created_questions(create_user.id, qcreated, db_session)
    result = user_db.get_user_created_questions(create_user.id, db_session)

    print(f"These are the results {result}")
    assert result
    assert len(result) == 3


@pytest.mark.parametrize(
    "role", [UserRoles.ADMIN, UserRoles.DEVELOPER, UserRoles.STUDENT, UserRoles.TEACHER]
)
def test_set_user_role(create_user, role, db_session):
    r = role_db.create_role(db_session, role, "")
    assert r
    user = user_db.set_user_role(create_user.id, role, db_session)
    print(f"This is the returned user {user}")
    assert user
    assert user.role.name == role.value


@pytest.mark.parametrize(
    "institution",
    [ValidInstitutions.CPP, ValidInstitutions.NORCO, ValidInstitutions.UCR],
)
def test_set_user_institution(create_user, institution, db_session):
    inst = instituion_db.create_institution(db_session, institution)
    assert inst
    user = user_db.set_user_institution(create_user.id, institution, db_session)
    print(f"This is the returned user {user}")
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
def test_create_user_full(user_data, institution, role, db_session):
    # Create the institution and role
    if institution:
        inst = instituion_db.create_institution(db_session, institution)
        assert inst
    r = role_db.create_role(db_session, role, "")
    
    assert r
    user = user_db.create_user_full(user_data, db_session, role, institution)
    print("This is the created user ", user)
    assert user
    if institution:
        assert user.institution.name == institution.value  # type: ignore
    assert user.role.name == role.value
