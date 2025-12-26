from src.api.database import question_attempt as qa
import pytest


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "quiz_data,submitted_answer",
    [
        ({"a": 1}, {"a": 1}),
        ({"a": 1, "b": 2}, {"a": 2, "b": 1}),
        ({"x": 0}, {"x": 5}),
    ],
)
async def test_create_attempt(quiz_data, make_submission_attempt, submitted_answer):
    user = None
    question = None

    attempt, user, question = await make_submission_attempt(quiz_data, submitted_answer, user, question)

    assert attempt is not None
    assert attempt.user_id == user.id  # type: ignore
    assert attempt.question_id == question.id  # type: ignore
    assert attempt.submitted_answer == submitted_answer


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "quiz_data,submissions",
    [
        (
            {"a": 1},
            [
                {"a": 1},  # correct
                {"a": 3},  # incorrect
                {"a": 0},  # edge case
            ],
        ),
        (
            {"a": 1, "b": 2},
            [
                {"a": 1, "b": 2},  # correct
                {"a": 2, "b": 1},  # swapped
                {"a": 1},  # partial
            ],
        ),
        (
            {"x": 0},
            [
                {"x": 0},  # correct
                {"x": 1},  # incorrect
                {},  # empty submission
            ],
        ),
    ],
)
async def test_multiple_attempts(
    make_submission_attempt,
    quiz_data,
    submissions,
):
    user = None
    question = None
    results = []

    for s in submissions:
        attempt, user, question = await make_submission_attempt(
            quiz_data=quiz_data,
            submission=s,
            user=user,
            question=question,
        )
        results.append(attempt)

    # --- assertions ---
    attempt_ids = [a.id for a in results]

    assert len(attempt_ids) == len(set(attempt_ids)), "Attempt IDs must be unique"

    for a in results:
        assert a.question_id == question.id  # type: ignore
        assert a.user_id == user.id  # type: ignore
