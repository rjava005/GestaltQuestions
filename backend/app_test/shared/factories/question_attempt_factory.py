from typing import Tuple
import pytest
from src.model.question import Question
from src.model.question_attempt import QuestionAttempt
from src.model.users import User


@pytest.fixture
def make_submission_attempt(make_user, make_question, qa_attempt_db):
    async def make(
        quiz_data,
        submission,
        user=None,
        question=None,
    ) -> Tuple[QuestionAttempt, User, Question]:

        if user is None:
            user = await make_user()

        if question is None:
            question = await make_question()

        attempt = await qa_attempt_db.create_attempt(
            question.id,
            user.id,
            quiz_data,
            submission,
        )

        return attempt, user, question

    return make
