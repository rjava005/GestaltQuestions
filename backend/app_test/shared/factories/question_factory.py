import pytest
from src.model.question import Question, QuestionData


@pytest.fixture
def make_question(question_db):
    async def make(
        **overrides,
    ) -> Question:
        defaults = {
            "title": "Sample Question",
            "ai_generated": True,
            "isAdaptive": False,
        }

        data = QuestionData.model_validate(defaults | overrides)
        return await question_db.create_question(data)

    return make
