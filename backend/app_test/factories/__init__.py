# --- Standard Library ---
from typing import Tuple

# --- Third-Party ---
import pytest

# --- Internal ---
from src.api.database import question as qdb
from src.api.database import question_attempt as qa
import src.api.database.user as user_db

from src.api.database.models.question import Question, QuestionData
from src.api.database.models.question_attempt import QuestionAttempt
from src.api.database.models.users import User, UserBase


@pytest.fixture
def make_user(db_session):
    def make(
        *,
        session=db_session,
        **overrides,
    ) -> User:
        defaults = {
            "first_name": "Luciano",
            "last_name": "Bermudez",
            "username": "luci123",
            "email": "luci123@gmail.com",
            "fb_id": "1234",
        }

        data = UserBase(**(defaults | overrides))  # type: ignore
        user = user_db.create_user(data, session)
        assert user
        return user

    return make


@pytest.fixture
def make_question(db_session):
    async def make(
        *,
        session=db_session,
        **overrides,
    ) -> Question:
        defaults = {
            "title": "Sample Question",
            "ai_generated": True,
            "isAdaptive": False,
        }

        data = QuestionData(**(defaults | overrides))
        return await qdb.create_question(data, session)

    return make


@pytest.fixture
def make_submission_attempt(make_user, make_question, db_session):
    async def make(
        quiz_data, submission, user=None, question=None, session=db_session
    ) -> Tuple[QuestionAttempt, User, Question]:
        if user is None:
            user = make_user()
        if question is None:
            question = await make_question()
        return (
            qa.create_attempt(question.id, user.id, quiz_data, submission, session),
            user,
            question,
        )

    return make


