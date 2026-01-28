import pytest
from app_test.shared.mock_data import (
    QUESTION_FULL,
    QUESTIONS,
    ADDITIONAL_METADATA,
    QUESTIONS_FULL,
)
from app_test.shared.factories import make_question, make_user, make_submission_attempt
from src.types import QuestionBase, QuestionData
from src.data import (
    QuestionDB,
    UserDB,
    RoleManager,
    InstitutionDB,
    QuestionAttemptDB,
)


@pytest.fixture
def combined_payload():
    return [QuestionData(**q) for q in QUESTIONS_FULL]


@pytest.fixture
def role_manager(db_session) -> RoleManager:
    return RoleManager(db_session)


@pytest.fixture
def user_db(db_session) -> UserDB:
    return UserDB(db_session)




@pytest.fixture
def institution_db(db_session) -> InstitutionDB:
    return InstitutionDB(db_session)


@pytest.fixture
def qa_attempt_db(db_session) -> QuestionAttemptDB:
    return QuestionAttemptDB(db_session)
