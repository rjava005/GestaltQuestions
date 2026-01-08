from ai_workspace.code_generator.graphs.gestalt_generator import (
    app as gestalt_code_generator,
    State,
)
from app_test.mock_data.mock import QUESTIONS
from ai_workspace.models import Question
import pytest


@pytest.fixture
def question_data():
    question = QUESTIONS[0]
    assert question
    return question


# Simple test to confirm that the gestalt generator works as expected
def test_gestalt_generator(question_data):
    input_q = Question(
        question_html="",
        question_text=question_data,
        solution_guide=None,
        final_answer=None,
    )
    input_state: State = {"question": input_q, "metadata": None, "files": {}}
    result = gestalt_code_generator.invoke(input_state, config=config)  # type: ignore
    assert result
