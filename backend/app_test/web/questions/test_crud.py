import pprint
from uuid import uuid4

import pytest

from app_test.shared.mock_data import QUESTION_FIELDS, QUESTIONS
from src.core import logger
from src.model.question import Question, QuestionData
from src.utils import validate_response_payload


@pytest.mark.parametrize("payload", list(QUESTIONS))
def test_create_question(make_question_web, payload) -> None:
    """Ensure a valid question payload creates a question successfully."""
    resp = make_question_web(**payload)
    # Check the body
    body = resp.json()
    # Helpful debug if status fails
    assert resp.status_code == 200, (
        f"\nStatus Code: {resp.status_code}"
        f"\nPayload:\n{pprint.pformat(payload)}"
        f"\nResponse Body:\n{pprint.pformat(body)}\n"
    )
    qcreated = Question.model_validate(body)
    # Validate core keys
    assert qcreated
    for key in QUESTION_FIELDS:
        validate_response_payload(payload, qcreated.model_dump(), key)


def test_create_question_bad_response(make_bad_question_web) -> None:
    """Ensure an invalid payload returns a 400 error with proper message."""
    resp = make_bad_question_web()
    body = resp.json()
    assert resp.status_code == 400
    assert "Failed to create question" in body["detail"]


# Retrieval
@pytest.mark.parametrize("payload", list(QUESTIONS))
def test_get_question(make_question_web, payload, make_retrieve_question) -> None:
    resp = make_question_web(**payload)
    qid = Question.model_validate(resp.json()).id
    # Act: retrieve the question
    retrieved = make_retrieve_question(qid)
    assert retrieved.status_code == 200, retrieved.text
    qretrieved = Question.model_validate(retrieved)
    assert qretrieved


def test_get_question_bad_id(api_client) -> None:
    bad_id = uuid4()
    r = api_client.get(f"/questions/{bad_id}")
    assert r.status_code == 404


def test_get_question_data_all_not_found(api_client) -> None:
    bad_id = uuid4()
    r = api_client.get(f"/questions/{bad_id}/all_data")
    assert r.status_code == 404


@pytest.mark.parametrize("payload", list(QUESTIONS))
def test_get_question_all_data(
    make_question_web, payload, make_retrieve_question_full
) -> None:
    resp = make_question_web(**payload)
    qid = Question.model_validate(resp.json()).id
    retrieved = make_retrieve_question_full(qid)
    assert retrieved.status_code == 200, retrieved.text
    qretrieved = QuestionData.model_validate(retrieved.json())
    assert qretrieved


def test_qet_all_questions(
    api_client, make_question_web, multiple_question_payloads
) -> None:
    for q in multiple_question_payloads:
        make_question_web(**q)
    offset, limit = 0, 100
    # Ensure that response was succesful
    response = api_client.get(f"/questions/{offset}/{limit}")
    assert response.status_code == 200, response.text
    questions = response.json()
    assert isinstance(questions, list), "Expected response to be a list"
    assert len(questions) == len(multiple_question_payloads), (
        f"Expected {len(multiple_question_payloads)} questions, got {len(questions)}"
    )
    logger.info("these are the questions %s", questions)


@pytest.mark.parametrize("payload", list(QUESTIONS))
def test_delete_question(
    payload, make_question_web, make_delete_question, make_retrieve_question
) -> None:
    resp = make_question_web(**payload)
    qid = Question.model_validate(resp.json()).id
    dresp = make_delete_question(qid)
    assert dresp.status_code == 200
    rresp = make_retrieve_question(qid)
    logger.debug(f"Retrieved question in deletion {rresp.json()}")
    assert rresp.status_code == 404
    assert "not find question" in rresp.json()["detail"].lower()


def test_delete_question_not_valid_id(api_client) -> None:
    bad_id = uuid4()
    response = api_client.delete(f"/questions/{bad_id}")
    assert response.status_code == 200
    assert response.json() is None


# Filter Test
@pytest.mark.asyncio
async def test_filter_questions_no_match(api_client) -> None:
    """
    Filtering with values that should not match anything.
    Expect an empty list.
    """
    payload = QuestionData(title="NonExistent", ai_generated=True)

    response = api_client.post("/questions/filter", json=payload.model_dump())
    assert response.status_code == 200

    data = response.json()
    logger.info("Filter with no match response: %s", data)

    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.asyncio
async def test_question_filter_by_title(
    api_client, make_question_web, multiple_question_payloads
) -> None:
    """
    Filter questions by a substring in the title.
    Expects at least one match from create_multiple_questions fixture.
    """
    for q in multiple_question_payloads:
        make_question_web(**q)
    payload = QuestionData(title=multiple_question_payloads[0].get("title"))

    response = api_client.post("/questions/filter", json=payload.model_dump())
    assert response.status_code == 200

    data = response.json()
    logger.info("Filter by title response: %s", data)

    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.parametrize("payload", list(QUESTIONS))
@pytest.mark.asyncio
async def test_update_question(api_client, make_question_web, payload) -> None:
    resp = make_question_web(**payload)
    qid = Question.model_validate(resp.json()).id
    updates = QuestionData(title="Updated Title", isAdaptive=True)

    patch_resp = api_client.put(
        f"/questions/{qid}",
        json=updates.model_dump(),
    )
    logger.info(f"This is the path response {patch_resp}")
    assert patch_resp.status_code == 200

    updated = patch_resp.json()
    assert updated["title"] == "Updated Title"
    assert updated["isAdaptive"] is True
