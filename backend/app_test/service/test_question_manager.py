import json
from src.model.question import Question
import pytest
from src.core import logger
from src.utils import safe_dir_name
from pathlib import Path
from app_test.shared.mock_data import QUESTIONS_FULL


# Test question creation
@pytest.mark.asyncio
async def test_create_question(question_manager, question_payload):
    qcreated = await question_manager.create_question(question_payload)
    assert qcreated
    assert isinstance(qcreated, Question)


@pytest.mark.asyncio
@pytest.mark.asyncio
async def test_create_question_with_files(
    question_manager,
    question_payload,
    question_file_payload,
):
    qcreated = await question_manager.create_question(
        question_payload,
        files=question_file_payload,
    )
    assert qcreated


# Test path functionality
@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_get_question_path(question_manager, payload, storage_mode):
    q = await question_manager.create_question(payload)
    path = await question_manager.get_question_path(q.id)
    logger.info(f"Testing getting path Path:  {path}")
    dir_name = safe_dir_name(f"{q.title}_{str(q.id)[:8]}")
    if storage_mode == "local":
        assert path == f"questions/{dir_name}"
    elif storage_mode == "cloud":
        assert f"test/questions/{dir_name}"


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_does_question_path_exist(question_manager, payload):
    q = await question_manager.create_question(payload)
    assert await question_manager.does_question_path_exist(q.id)


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_set_question_path_override_false(question_manager, payload):
    q = await question_manager.create_question(payload)
    with pytest.raises(ValueError) as exc_info:
        await question_manager.set_question_path(q.id, path="myNewPath", override=False)
    assert (
        str(exc_info.value) == "Question path already exists and override is disabled"
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_set_question_path(question_manager, payload):
    q = await question_manager.create_question(payload)
    await question_manager.set_question_path(q.id, path="myNewPath", override=True)
    assert (
        await question_manager.get_question_path(q.id, relative=True)
        == "questions/myNewPath"
    )


# Question file test
@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_get_question_file_names(
    question_manager, payload, question_file_payload
):
    qcreated = await question_manager.create_question(
        payload,
        files=question_file_payload,
    )
    filenames = await question_manager.get_question_file_names(qcreated.id)
    assert len(filenames) > 0
    # Assert that the names of the files are all the same
    assert set([f.filename for f in question_file_payload]) == set(filenames)
    logger.info(f"filenames {filenames}")


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_get_question_filepaths(
    question_manager,
    payload,
    question_file_payload,
):
    qcreated = await question_manager.create_question(
        payload,
        files=question_file_payload,
    )
    logger.info("This is the created question %s", qcreated)
    filepaths = await question_manager.get_question_file_names(qcreated.id)
    logger.info(f"The retrieved filepaths {filepaths}")
    assert filepaths
    assert len(filepaths) == len(question_file_payload)
    assert set([f.filename for f in question_file_payload]) == set(
        [Path(f).name for f in filepaths]
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_get_question_file(
    question_manager,
    payload,
    question_file_payload,
):
    qcreated = await question_manager.create_question(
        payload,
        files=question_file_payload,
    )
    for f in question_file_payload:
        retrieved = await question_manager.get_question_file(
            qcreated.id,
            f.filename,
        )
        assert retrieved


# Test for reading and writting
@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_read_file(
    question_manager,
    payload,
    question_file_payload,
):
    qcreated = await question_manager.create_question(
        payload,
        files=question_file_payload,
    )

    for f in question_file_payload:
        content = await question_manager.read_file(qcreated.id, f.filename)

        if f.filename.endswith(".json"):
            assert json.loads(content) == f.content
        else:
            assert f.content == content


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_update_file(
    question_manager,
    payload,
    question_file_payload,
):
    qcreated = await question_manager.create_question(
        payload,
        files=question_file_payload,
    )
    logger.info("This is the file payload", question_file_payload)
    for f in question_file_payload:
        new_content = f"New Content {f.filename}"
        await question_manager.update_file(
            qcreated.id, filename=f.filename, content=new_content
        )
        content = await question_manager.read_file(qcreated.id, f.filename)
        assert content == new_content


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", QUESTIONS_FULL)
async def test_delete_file(
    question_manager,
    payload,
    question_file_payload,
):
    qcreated = await question_manager.create_question(
        payload,
        files=question_file_payload,
    )

    for f in question_file_payload:
        await question_manager.delete_file(qcreated.id, f.filename)
        data = await question_manager.read_file(qcreated.id, f.filename)
        assert data is None


@pytest.mark.asyncio
async def test_handle_question_files(
    question_manager,
    question_file_payload,
):
    storage_path = "qs_test"

    data = await question_manager.handle_question_files(
        question_file_payload,
        storage_path,
        True,
    )

    assert data["client_files"] == []
    assert len(data["other_files"]) == len(question_file_payload)
