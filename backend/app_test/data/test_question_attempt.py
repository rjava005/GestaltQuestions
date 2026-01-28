from app_test.shared.factories import make_submission_attempt, make_question, make_user
from src.core import logger
import pytest
from app_test.shared.mock_data.question_submission import SCENARIOS, ATTEMPTS


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "attempt_case",
    ATTEMPTS,
    ids=lambda x: f"quiz={x['quiz_data']}-n={len(x['submissions'])}",
)
async def test_create_attempt(make_submission_attempt, attempt_case):
    quiz_data = attempt_case["quiz_data"]
    submissions = attempt_case["submissions"]
    user = None
    question = None

    attempt, user, question = await make_submission_attempt(
        quiz_data, submissions[0], user, question
    )

    assert attempt is not None
    assert attempt.user_id == user.id  # type: ignore
    assert attempt.question_id == question.id  # type: ignore
    assert attempt.submitted_answer == submissions[0]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "attempt_case",
    ATTEMPTS,
    ids=lambda x: f"quiz={x['quiz_data']}-n={len(x['submissions'])}",
)
async def test_multiple_attempts(make_submission_attempt, attempt_case):
    quiz_data = attempt_case["quiz_data"]
    submissions = attempt_case["submissions"]
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


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "attempt_case",
    ATTEMPTS,
    ids=lambda x: f"quiz={x['quiz_data']}-n={len(x['submissions'])}",
)
async def test_get_attempts_by_user(make_submission_attempt, attempt_case, qa_attempt_db):
    quiz_data = attempt_case["quiz_data"]
    submissions = attempt_case["submissions"]
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
    attempts = await qa_attempt_db.get_attempts_by_user(user.id)  # type: ignore
    assert len(attempts) == len(submissions)
    assert all([a.user_id == user.id for a in attempts])  # type: ignore


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "attempt_case",
    ATTEMPTS,
    ids=lambda x: f"quiz={x['quiz_data']}-n={len(x['submissions'])}",
)
async def test_get_attempts_by_question(
    make_submission_attempt, attempt_case, qa_attempt_db
):
    user = None
    question = None
    results = []
    quiz_data = attempt_case["quiz_data"]
    submissions = attempt_case["submissions"]
    for s in submissions:
        attempt, user, question = await make_submission_attempt(
            quiz_data=quiz_data,
            submission=s,
            user=user,
            question=question,
        )
        results.append(attempt)
    attempts = await qa_attempt_db.get_attempts_by_question(question.id)  # type: ignore

    assert all(a.question_id == question.id for a in attempts)  # type: ignore


@pytest.mark.asyncio
@pytest.mark.parametrize("scenario", SCENARIOS)
async def test_student_question_scenarios(
    scenario, make_user, make_question, make_submission_attempt, qa_attempt_db
):
    logger.debug(f"\n{'*'*25}\n")
    logger.debug("This is the scenario\n %s", scenario)

    # Unpack the data
    users_data = scenario.get("users", None)["users"]
    questions_data = scenario.get("questions", None)["questions"]
    attempts = scenario.get("attempts", None)
    quiz_data = attempts.get("quiz_data", None)
    submissions = attempts.get("submissions", None)
    assert isinstance(users_data, list) and users_data
    assert isinstance(questions_data, list) and questions_data
    assert isinstance(submissions, list) and submissions

    # Create users and questions
    created_users = [await make_user(**u) for u in users_data]
    created_questions = [await make_question(**q) for q in questions_data]

    seen_attempt_ids = set()

    # Create multiple
    for user in created_users:
        for question in created_questions:
            for submission in submissions:
                attempt, _, _ = await make_submission_attempt(
                    quiz_data=quiz_data,
                    submission=submission,
                    user=user,
                    question=question,
                )
                # Basic Assertions
                assert attempt.user_id == user.id
                assert attempt.question_id == question.id
                assert attempt.id not in seen_attempt_ids
                seen_attempt_ids.add(attempt.id)
    # After all the creation and attemps check that we are able to
    # retrieve all the information
    for u in created_users:
        for q in created_questions:
            a = await qa_attempt_db.get_attempt_by_user_and_question(q.id, u.id)
            logger.debug("This is the users attempt for the question  % s", a)
            assert a is not None, f"No attempt found for user={u.id} question={q.id}"
