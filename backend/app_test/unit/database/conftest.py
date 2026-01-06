import pytest
from app_test.mock_data import QUESTION_FULL, QUESTIONS, ADDITIONAL_METADATA

# Keep these factories present
from app_test.factories import make_question, make_submission_attempt, make_user


@pytest.fixture
@pytest.mark.asyncio
async def create_question_with_relationship(make_question):
    qcreated = await make_question(**QUESTION_FULL)
    assert qcreated
    return qcreated, ADDITIONAL_METADATA


@pytest.fixture
def combined_payload():
    return QUESTIONS
