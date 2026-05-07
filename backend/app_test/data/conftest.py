import pytest
from app_test.shared.mock_data import (
    QUESTIONS,
)
from src.model.question import QuestionData
from src.data import (
    QuestionAttemptDB,
)



@pytest.fixture
def combined_payload():
    return [QuestionData(**q) for q in QUESTIONS]











@pytest.fixture
def qa_attempt_db(db_session) -> QuestionAttemptDB:
    return QuestionAttemptDB(db_session)


@pytest.fixture
def question_payload():
    """Full question payload including topics, qtypes, and languages."""
    return QUESTIONS[0]
