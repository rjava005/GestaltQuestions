import json
from pathlib import Path, PurePosixPath
from typing import Any, Dict

import pytest

from src.core import logger
from src.model.question import Question
from src.service.file_service.utils import safe_dir_name
from app_test import QuestionManager
from app_test.shared.factories.question_manager_factory import MakeQuestionFactory
from app_test.shared.mock_data import QUESTIONS


# Test question creation
@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
async def test_create_question_no_files(
    question_manager: QuestionManager,
    qdata: Dict[str, Any],
    make_question_qm: MakeQuestionFactory,
):
    # Arrange
    q, d = await make_question_qm(qdata)

    # Form the expected path for the question
    base_path = d.base_path
    dir_name = safe_dir_name(f"{q.title}_{str(q.id)[:8]}")
    expected_path = (PurePosixPath(base_path or "") / dir_name).as_posix() + "/"

    # Check the actual path is expected
    storage_type = question_manager.storage.get_storage_type()

    if storage_type == "cloud":
        actual_path = q.blob_path
    else:
        actual_path = q.local_path

    # Assert stored path correctness
    assert actual_path == expected_path

    # Assert storage was actually created
    assert question_manager.storage.exists(expected_path)


@pytest.mark.asyncio
@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
async def test_create_question_with_files_added_ok(
    question_manager,
    make_question_qm: MakeQuestionFactory,
    question_file_payload,
    qdata,
):
    q, d = await make_question_qm(
        qdata,
        files=question_file_payload,
    )
    rfiles = await question_manager.retrieve_question_files(q.id)
    # Returns the full path, normalize
    rfiles = [Path(r).name for r in rfiles]

    assert q
    assert d
    assert len(rfiles) == len(question_file_payload)
    assert set(rfiles) == set([f.filename for f in question_file_payload])


@pytest.mark.asyncio
@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
async def test_create_question_with_files_expected_path_exists(
    question_manager,
    make_question_qm: MakeQuestionFactory,
    question_file_payload,
    qdata,
):
    q, d = await make_question_qm(
        qdata,
        files=question_file_payload,
    )

    base_path = d.base_path
    dir_name = safe_dir_name(f"{q.title}_{str(q.id)[:8]}")
    expected_path = (PurePosixPath(base_path or "") / dir_name).as_posix() + "/"

    storage_type = question_manager.storage.get_storage_type()

    if storage_type == "cloud":
        actual_path = q.blob_path
    else:
        actual_path = q.local_path

    assert actual_path == expected_path
    assert question_manager.storage.exists(expected_path)

    for f in question_file_payload:
        expected = Path(expected_path) / Path(f.filename).name
        assert question_manager.storage.exists(expected)


## Test Delete Question
@pytest.mark.asyncio
@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
async def test_delete_question(
    question_manager: QuestionManager,
    qdata: Dict[str, Any],
    make_question_qm: MakeQuestionFactory,
):
    # Arrange
    q, _ = await make_question_qm(qdata)

    # Get storage location
    storage_type = question_manager.storage.get_storage_type()
    if storage_type == "cloud":
        actual_path = q.blob_path
    else:
        actual_path = q.local_path

    await question_manager.delete_question(q.id)

    assert await question_manager.qdb.get_question(q.id) is None
    assert not question_manager.storage.exists(str(actual_path))


# Test storage move
@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
@pytest.mark.parametrize(
    "destination",
    [
        "MovedPath/",
        "archive/",
        "deep/new/location/",
    ],
)
async def test_handle_storage_update(
    question_manager: QuestionManager,
    qdata: Dict[str, Any],
    make_question_qm: MakeQuestionFactory,
    destination: str,
    tmp_path,
):
    # Arrange
    q, _ = await make_question_qm(qdata)

    def get_path(question: Question) -> str:
        return (
            question.blob_path
            if question_manager.storage.get_storage_type() == "cloud"
            else question.local_path
        )  # type: ignore

    old_path = get_path(q)

    # Storage for cloud test does not work
    if question_manager.storage.get_storage_type() == "cloud":
        return

    destination = (tmp_path / destination).as_posix()
    # Act
    print("This is the target destination", destination)
    await question_manager.handle_storage_update(q.id, destination=destination)

    new_path = get_path(q)

    # Assert
    assert new_path == f"{destination}/"
    assert not question_manager.storage.exists(old_path)


@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
@pytest.mark.parametrize(
    "destination",
    [
        "MovedPath/",
        "archive/",
        "deep/new/location/",
    ],
)
async def test_handle_storage_update_with_files(
    question_manager: QuestionManager,
    qdata: Dict[str, Any],
    make_question_qm: MakeQuestionFactory,
    question_file_payload,
    destination: str,
    tmp_path,
):
    # Arrange
    q, _ = await make_question_qm(
        qdata,
        files=question_file_payload,
    )

    storage = question_manager.storage
    if storage.get_storage_type() == "cloud":
        return
    destination = (tmp_path / destination).as_posix()
    # Act
    print("This is the target destination", destination)

    def get_path(question: Question) -> str:
        return (
            question.blob_path
            if storage.get_storage_type() == "cloud"
            else question.local_path
        )  # type: ignore

    old_path = get_path(q)
    logger.info("This is the old path %s ", old_path)

    # Confirm files exist before move
    original_files = await question_manager.retrieve_question_files(q.id)
    assert len(original_files) == len(question_file_payload)
    logger.info(f"Received files just fine {original_files}")

    # Act
    await question_manager.handle_storage_update(q.id, destination=destination)

    new_path = get_path(q)

    # Assert question path updated
    assert new_path == f"{destination}/"
    assert not storage.exists(old_path)

    # Assert files moved
    moved_files = await question_manager.retrieve_question_files(q.id)
    print("These are the moved files", moved_files)
    moved_filenames = {Path(f).name for f in moved_files}

    expected_filenames = {f.filename for f in question_file_payload}

    assert moved_filenames == expected_filenames

    # Confirm new storage location contains files
    for filename in expected_filenames:
        expected_file_path = PurePosixPath(destination) / filename
        assert storage.exists(str(expected_file_path))


@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
async def test_read_question_file(
    question_manager: QuestionManager,
    make_question_qm: MakeQuestionFactory,
    question_file_payload,
    qdata,
):
    q, _ = await make_question_qm(qdata, files=question_file_payload)

    for f in question_file_payload:
        content = await question_manager.read_question_file(q.id, f.filename)
        
        assert content

        if f.filename.endswith(".json"):
            assert json.loads(content.decode()) == f.content
        else:
            assert content.decode() == f.content


@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
async def test_update_question_file(
    question_manager: QuestionManager,
    make_question_qm: MakeQuestionFactory,
    question_file_payload,
    qdata,
):
    q, _ = await make_question_qm(qdata, files=question_file_payload)

    for f in question_file_payload:
        new_content = f"Updated content for {f.filename}"

        await question_manager.write_question_file(
            q.id,
            filename=f.filename,
            data=new_content,
        )

        updated = await question_manager.read_question_file(q.id, f.filename)
        assert updated.decode() == new_content


@pytest.mark.asyncio
@pytest.mark.parametrize("qdata", QUESTIONS[:3])
async def test_delete_question_file(
    question_manager: QuestionManager,
    make_question_qm: MakeQuestionFactory,
    question_file_payload,
    qdata,
):
    q, _ = await make_question_qm(qdata, files=question_file_payload)

    for f in question_file_payload:
        await question_manager.delete_file(q.id, f.filename)

        # After deletion, reading should fail or return None
        try:
            result = await question_manager.read_question_file(q.id, f.filename)
        except Exception:
            result = None

        assert result is None


# Todo fix this test and ensure it works properly
# @pytest.mark.asyncio
# async def test_handle_question_files_split(
#     question_manager: QuestionManager,
#     question_file_payload,
# ):
#     storage_path = "qs_test"

#     result = await question_manager.handle_question_files(
#         question_file_payload,
#         storage_path,
#         auto_handle_images=True,
#     )

#     assert result["status"] == "ok"

#     # Ensure client file splitting worked
#     client_files = [
#         f
#         for f in question_file_payload
#         if Path(f.filename).suffix.lower() in question_manager.client_ext
#     ]

#     other_files = [
#         f
#         for f in question_file_payload
#         if Path(f.filename).suffix.lower() not in question_manager.client_ext
#     ]

#     assert len(result["client_files"] or []) == len(client_files)
#     assert len(result["other_files"] or []) == len(other_files)
