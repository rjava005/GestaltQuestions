import pytest
from typing import Any
from src.data.exceptions.question_exceptions import QuestionValidationError
from src.model.question import Question, QuestionCreate, QuestionRead, QuestionUpdate
from src.data.question import QuestionDB
from uuid import uuid4

PayloadMap = dict[str, QuestionCreate]


@pytest.fixture
def question_payloads() -> PayloadMap:
    return {
        "basic": QuestionCreate(
            title="Addition",
            ai_generated=True,
            isAdaptive=False,
        ),
        "nested": QuestionCreate(
            title="Multiplication",
            ai_generated=True,
            isAdaptive=False,
        ),
        "scoped": QuestionCreate(
            title="Division",
            ai_generated=False,
            isAdaptive=False,
        ),
        "with_relationships": QuestionCreate(
            title="Bernoulli Equation",
            ai_generated=True,
            isAdaptive=True,
            topics=["fluid-dynamics", "flow-analysis"],
            qTypes=["multiple-choice"],
        ),
        "filter_seed": QuestionCreate(
            title="Addition",
            ai_generated=True,
            isAdaptive=False,
            topics=["math"],
            qTypes=["multiple-choice"],
        ),
        "creator_owned": QuestionCreate(
            title="Creator Owned",
            ai_generated=False,
            isAdaptive=False,
        ),
    }


@pytest.fixture
def bad_question_payloads() -> dict[str, dict[str, Any]]:
    return {
        "invalid_title_type": {
            "title": {"bad": "value"},
            "ai_generated": True,
            "isAdaptive": False,
        },
        "invalid_topic_shape": {
            "title": "Bad Topics",
            "ai_generated": True,
            "isAdaptive": False,
            "topics": [{"name": "math"}],
        },
        "invalid_uuid": {
            "id": "not-a-real-uuid",
            "title": "Bad UUID",
            "ai_generated": False,
            "isAdaptive": False,
        },
    }


@pytest.fixture
def combined_payload(question_payloads: PayloadMap) -> list[QuestionCreate]:
    return [
        question_payloads["basic"],
        question_payloads["nested"],
        question_payloads["scoped"],
    ]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload_key",
    ["basic", "nested", "scoped"],
)
async def test_create_question(
    question_db: QuestionDB,
    question_payloads: PayloadMap,
    payload_key: str,
) -> None:
    payload = question_payloads[payload_key]

    created = await question_db.create_question(payload)

    assert created is not None
    assert isinstance(created, Question)
    assert created.title == payload.title
    assert created.ai_generated == payload.ai_generated
    assert created.isAdaptive == payload.isAdaptive


@pytest.mark.asyncio
async def test_create_question_with_relationships(
    question_db: QuestionDB,
    question_payloads: PayloadMap,
) -> None:
    payload = question_payloads["with_relationships"]

    created = await question_db.create_question(payload)

    assert created is not None
    assert created.title == payload.title
    assert len(created.topics) == 2
    assert len(created.qTypes) == 1


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload_key",
    ["basic", "with_relationships"],
)
async def test_get_question(
    question_db: QuestionDB,
    question_payloads: PayloadMap,
    payload_key: str,
) -> None:
    payload = question_payloads[payload_key]

    created = await question_db.create_question(payload)
    found = await question_db.get_question(created.id)

    assert found == created


@pytest.mark.asyncio
async def test_get_all_questions(
    question_db: QuestionDB,
    combined_payload: list[QuestionCreate],
) -> None:
    for payload in combined_payload:
        created = await question_db.create_question(payload)
        assert created is not None

    questions = await question_db.get_all_questions()

    assert isinstance(questions, list)
    assert all(isinstance(question, Question) for question in questions)
    assert len(questions) == len(combined_payload)


@pytest.mark.asyncio
async def test_delete_all_questions(
    question_db: QuestionDB,
    combined_payload: list[QuestionCreate],
) -> None:
    for payload in combined_payload:
        created = await question_db.create_question(payload)
        assert created is not None

    deleted = await question_db.delete_all_questions()
    questions = await question_db.get_all_questions()

    assert deleted is True
    assert questions == []


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload_key",
    ["basic", "with_relationships"],
)
async def test_delete_question(
    question_db: QuestionDB,
    question_payloads: PayloadMap,
    payload_key: str,
) -> None:
    payload = question_payloads[payload_key]

    created = await question_db.create_question(payload)
    deleted = await question_db.delete_question(created.id)

    assert deleted is True
    assert await question_db.get_question(created.id) is None


@pytest.mark.asyncio
async def test_update_question_updates_scalar_and_relationship_fields(
    question_db: QuestionDB,
    question_payloads: PayloadMap,
) -> None:
    created = await question_db.create_question(question_payloads["basic"])

    update_data = QuestionUpdate(
        title="new title",
        topics=["history", "math", "science"],
    )

    updated = await question_db.update_question(created.id, update_data)

    assert updated is not None
    assert isinstance(updated, QuestionRead)
    assert updated.title == "new title"
    assert set(updated.topics) == set(["history", "math", "science"])


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload_key",
    ["basic", "with_relationships"],
)
async def test_set_question_path(
    question_db: QuestionDB,
    question_payloads: PayloadMap,
    payload_key: str,
) -> None:
    payload = question_payloads[payload_key]

    created = await question_db.create_question(payload)
    updated = await question_db.set_question_path(
        created.id,
        path="/test",
    )

    assert updated.storage_path == "/test/"


@pytest.mark.asyncio
async def test_create_question_does_not_set_storage_path(
    question_db: QuestionDB,
    question_payloads: PayloadMap,
) -> None:
    payload = question_payloads["creator_owned"]

    q = await question_db.create_question(payload)

    assert q is not None
    assert isinstance(q, Question)
    assert q.title == payload.title
    assert q.ai_generated == payload.ai_generated
    assert q.isAdaptive == payload.isAdaptive
    assert q.storage_path is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload_key",
    ["invalid_title_type", "invalid_topic_shape"],
)
async def test_create_question_with_bad_payload_raises_validation_error(
    question_db: QuestionDB,
    bad_question_payloads: PayloadMap,
    payload_key: str,
) -> None:
    payload = bad_question_payloads[payload_key]

    with pytest.raises(
        QuestionValidationError,
        match="Question payload is invalid",
    ):
        await question_db.create_question(payload)


@pytest.mark.asyncio
async def test_create_question_with_bad_uuid_raises_value_error(
    question_db: QuestionDB,
    bad_question_payloads: PayloadMap,
) -> None:
    payload = bad_question_payloads["invalid_uuid"]

    with pytest.raises(ValueError, match="Invalid UUID"):
        await question_db.create_question(payload)


@pytest.mark.asyncio
async def test_get_questions_by_user_returns_all_questions_for_creator(
    question_db: QuestionDB,
) -> None:
    user = uuid4()
    other_user = uuid4()

    created_for_user = [
        Question(title="Q1", storage_path="developers/user123/q1/", created_by_id=user),
        Question(title="Q2", storage_path="developers/user123/q2/", created_by_id=user),
        Question(title="Q3", storage_path="developers/user123/q3/", created_by_id=user),
    ]
    other_question = Question(
        title="Q4",
        storage_path="developers/other-user/q4/",
        created_by_id=other_user,
    )
    question_db.session.add_all([*created_for_user, other_question])
    question_db.session.commit()

    q_retrieved = await question_db.get_questions_by_creator(user)

    assert q_retrieved
    assert len(q_retrieved) == len(created_for_user)
    assert {q.id for q in q_retrieved} == {q.id for q in created_for_user}
    assert all(q.created_by_id == user for q in q_retrieved)
    assert other_question.id not in {q.id for q in q_retrieved}
