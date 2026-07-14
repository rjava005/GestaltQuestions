import pytest
from sqlmodel import Session
from backend.auth import InstitutionDB, Role, RoleDB, UserDB, UserRoles


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
