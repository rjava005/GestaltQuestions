import pytest
from src.data.role import RoleDB
from src.data.user import UserDB
from src.data.institution import InstitutionDB


# Create the database session
@pytest.fixture
def user_db(db_session) -> UserDB:
    return UserDB(db_session)


@pytest.fixture
def institution_db(db_session) -> InstitutionDB:
    return InstitutionDB(db_session)


@pytest.fixture
def role_manager(db_session) -> RoleDB:
    return RoleDB(db_session)
