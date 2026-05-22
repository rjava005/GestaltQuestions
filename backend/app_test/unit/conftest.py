import pytest
from sqlmodel import Session

from src.data.institution import InstitutionDB
from src.data.role import RoleDB
from src.data.user import UserDB
from src.model import Role, UserRoles


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


@pytest.fixture
def seed_roles(db_session: Session):
    roles = [
        Role(name=UserRoles.STUDENT.value),
        Role(name=UserRoles.ADMIN.value),
        Role(name=UserRoles.DEVELOPER.value),
    ]
    db_session.add_all(roles)
    db_session.commit()
    return roles
