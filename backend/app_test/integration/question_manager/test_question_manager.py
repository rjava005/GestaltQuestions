import json
from pathlib import PurePosixPath
from uuid import UUID

import pytest

from backend.question import QuestionCreate, QuestionUpdate
from backend.question_manager.exceptions import (
    FileOperationError,
    QuestionNotFoundError,
)
from backend.question_manager.services.manager import QuestionManager
from backend.storage import FileData
from backend.utils import safe_dir_name


def expected_question_path(base_path: str, title: str, qid: UUID) -> str:
    slug = safe_dir_name(title, max_length=80)
    return f"{base_path.rstrip('/')}/questions/{slug}_{str(qid)[:8]}/"


async def assert_file_is_unreadable(
    question_manager: QuestionManager,
    question_id: UUID,
    filename: str,
) -> None:
    try:
        result = await question_manager.read_file(question_id, filename)
    except FileOperationError:
        return

    assert result is None


@pytest.mark.asyncio
async def test_create_question_sets_storage_path(
    question_manager: QuestionManager,
    question_payload: QuestionCreate,
    storage_base_path: str,
) -> None:
    question = await question_manager.create_question(
        question_payload,
        storage_base_path,
    )

    assert question.id
    assert question.storage_path == expected_question_path(
        storage_base_path,
        question_payload.title,
        question.id,
    )
    assert await question_manager.qdb.get_question(question.id) == question


@pytest.mark.asyncio
async def test_create_question_saves_initial_files(
    question_manager: QuestionManager,
    question_payload: QuestionCreate,
    question_files: list[FileData],
    storage_base_path: str,
) -> None:
    question = await question_manager.create_question(
        question_payload,
        storage_base_path=storage_base_path,
        files=question_files,
    )

    stored_files = await question_manager.get_question_files(question.id)

    assert {PurePosixPath(path).name for path in stored_files} == {
        file.filename for file in question_files
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("filename", "new_content"),
    [
        ("question.html", "<p>Updated question</p>"),
        ("meta.json", {"difficulty": "hard"}),
    ],
)
async def test_read_write_and_delete_question_file(
    question_manager: QuestionManager,
    question_payload: QuestionCreate,
    question_files: list[FileData],
    storage_base_path: str,
    filename: str,
    new_content: str | dict[str, str],
) -> None:
    question = await question_manager.create_question(
        question_payload,
        storage_base_path=storage_base_path,
        files=question_files,
    )

    await question_manager.write_file(question.id, filename, new_content)
    raw = await question_manager.read_file(question.id, filename)

    assert raw is not None
    if isinstance(new_content, dict):
        assert json.loads(raw.decode()) == new_content
    else:
        assert raw.decode() == new_content

    await question_manager.delete_file(question.id, filename)

    await assert_file_is_unreadable(question_manager, question.id, filename)


@pytest.mark.asyncio
async def test_upload_files_adds_files_to_existing_question(
    question_manager: QuestionManager,
    question_payload: QuestionCreate,
    storage_base_path: str,
) -> None:
    question = await question_manager.create_question(
        question_payload,
        storage_base_path=storage_base_path,
    )
    uploaded = [
        FileData(filename="server.js", content="console.log('ok')"),
        FileData(filename="client.js", content="console.log('client')"),
    ]

    saved_paths = await question_manager.upload_files(question.id, uploaded)
    stored_files = await question_manager.get_question_files(question.id)

    assert {PurePosixPath(path).name for path in saved_paths} == {
        file.filename for file in uploaded
    }
    assert {PurePosixPath(path).name for path in stored_files} == {
        file.filename for file in uploaded
    }


@pytest.mark.asyncio
async def test_update_question_meta_updates_database_only(
    question_manager: QuestionManager,
    question_payload: QuestionCreate,
    storage_base_path: str,
) -> None:
    question = await question_manager.create_question(
        question_payload,
        storage_base_path=storage_base_path,
    )

    updated = await question_manager.update_question_meta(
        question.id,
        QuestionUpdate(title="Updated title", topics=["math"]),
    )

    assert updated.title == "Updated title"
    assert updated.topics == ["math"]


@pytest.mark.asyncio
async def test_delete_question_removes_database_record_and_storage(
    question_manager: QuestionManager,
    question_payload: QuestionCreate,
    question_files: list[FileData],
    storage_base_path: str,
) -> None:
    question = await question_manager.create_question(
        question_payload,
        storage_base_path=storage_base_path,
        files=question_files,
    )
    storage_path = question.storage_path

    assert await question_manager.delete_question(question.id) is True
    assert await question_manager.qdb.get_question(question.id) is None
    assert storage_path is not None
    assert not question_manager.storage.storage.exists(storage_path)


@pytest.mark.asyncio
async def test_get_question_raises_for_missing_question(
    question_manager: QuestionManager,
) -> None:
    missing_id = "00000000-0000-0000-0000-000000000000"

    with pytest.raises(QuestionNotFoundError):
        await question_manager.get_question(missing_id)
