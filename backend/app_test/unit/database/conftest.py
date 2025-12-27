import pytest
from app_test.mock_data import QUESTION_FULL
from app_test.factories import make_question, make_user, make_submission_attempt
import src.api.database.question as qdb


@pytest.fixture
@pytest.mark.asyncio
async def create_question_with_relationship(db_session):
    qcreated = await qdb.create_question(QUESTION_FULL, db_session)
    assert qcreated
    return qcreated

