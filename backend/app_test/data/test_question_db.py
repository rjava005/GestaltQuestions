import pytest
from src.model.question import Question
from src.types import QuestionData
from src.core.logging import logger
from app_test.shared.mock_data import QUESTION_FULL,QUESTIONS_FULL, ADDITIONAL_METADATA
from app_test.shared.factories import make_question

# Fixtures


@pytest.fixture
@pytest.mark.asyncio
async def create_question_with_relationship(make_question):
    qcreated = await make_question(**QUESTION_FULL)
    assert qcreated
    return qcreated, ADDITIONAL_METADATA


# ----------------------
# Minimal creation (no topics)
# ----------------------
@pytest.mark.asyncio
async def test_create_question(question_db, question_payload):
    qcreated = await question_db.create_question(question_payload)
    assert qcreated
    for key, _ in question_payload.items():
        assert getattr(qcreated, key) == question_payload[key]


@pytest.mark.asyncio
async def test_create_question_with_relationship_data(
    create_question_with_relationship,
):
    qcreated, relationship_payload = await create_question_with_relationship

    for key, _ in relationship_payload.items():
        logger.info("Relationship data %s", getattr(qcreated, key))
        qrel = getattr(qcreated, key)
        logger.info("This is the relationsip %s", qrel)
        # Convert to a list with just the names and set for comparing
        assert set([r.name for r in qrel]) == set(relationship_payload[key])


@pytest.mark.asyncio
@pytest.mark.parametrize("payload",QUESTIONS_FULL)
async def test_get_question(question_db, payload):
    qcreated = await question_db.create_question(payload)
    assert qcreated == await question_db.get_question(qcreated.id)


@pytest.mark.asyncio
async def test_get_all_questions(question_db, combined_payload):
    # Create data
    for q in combined_payload:
        qcreated = await question_db.create_question(q)
        assert qcreated
    questions = await question_db.get_all_questions()
    assert isinstance(questions, list)
    assert all(isinstance(q, Question) for q in questions)
    assert len(combined_payload) == len(questions)


# Test Deleting questions
@pytest.mark.asyncio
async def test_delete_all_questions(question_db, combined_payload):
    for q in combined_payload:
        qcreated = await question_db.create_question(
            q,
        )
        assert qcreated
    await question_db.delete_all_questions()
    questions = await question_db.get_all_questions()
    assert isinstance(questions, list)
    assert questions == []


@pytest.mark.asyncio
async def test_delete_single(question_db, combined_payload):
    for q in combined_payload:
        qcreated = await question_db.create_question(
            q,
        )
        assert qcreated

        # Get the question
        assert await question_db.get_question(
            qcreated.id,
        )
        await question_db.delete_question(
            qcreated.id,
        )
        assert (
            await question_db.get_question(
                qcreated.id,
            )
            is None
        )


@pytest.mark.asyncio
async def test_get_question_data(create_question_with_relationship, question_db):
    qcreated, _ = await create_question_with_relationship
    data = await question_db.get_question_data(
        qcreated.id,
    )
    assert data


@pytest.mark.asyncio
async def test_question_update(question_db, question_payload):

    qcreated = await question_db.create_question(
        question_payload,
    )
    assert qcreated is not None
    assert isinstance(qcreated, Question)

    update_data = QuestionData(title="new title", topics=["history", "math", "science"])

    qupdate = await question_db.update_question(
        qcreated.id,
        update_data,
    )
    logger.info("This is the question %s ", qupdate)
    assert qupdate is not None
    assert isinstance(qupdate, QuestionData)

    assert qupdate.title == "new title"
    assert isinstance(qupdate.topics, list)
    assert len(qupdate.topics) == 3


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "update_data, expected_count, description",
    [
        (
            QuestionData(title="Addition", ai_generated=False),
            1,
            "Should find question with partial title 'Sample' and ai_generated=True",
        ),
        (
            QuestionData(topics=["math"]),
            1,
            "Should find question related to topic 'math'",
        ),
        (
            QuestionData(title="Unknown", topics=["history"]),
            0,
            "No question should match a wrong title and nonexistent topic",
        ),
    ],
)
async def test_filter_questions(
    make_question, question_db, update_data, expected_count, description
):
    """Test dynamic question filtering across key combinations."""
    await make_question(**QUESTION_FULL)
    results = await question_db.filter_questions(
        update_data,
    )

    print(f"\n{description}")
    print(f"Input: {update_data}")
    print(f"Results: {results}")

    assert isinstance(results, list)
    assert len(results) == expected_count
    if expected_count:
        assert all(isinstance(r, QuestionData) for r in results)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "STORAGE_TYPE, expected_attr",
    [
        ("cloud", "blob_path"),
        ("local", "local_path"),
    ],
)
async def test_setting_path(question_db, question_payload, STORAGE_TYPE, expected_attr):
    # Create a test question
    qcreated = await question_db.create_question(
        question_payload,
    )
    assert qcreated

    # Run set_question_path for both storage types
    q = await question_db.set_question_path(
        qcreated.id,
        path="/test",
        STORAGE_TYPE=STORAGE_TYPE,
    )

    # Validate based on storage type
    assert getattr(q, expected_attr) == "/test"
