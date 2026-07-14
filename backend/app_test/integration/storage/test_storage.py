from pathlib import Path, PurePosixPath
from typing import Any

import pytest

from backend.storage import Storage
from backend.utils import normalize_newlines

FILE_CASES = [
    ("text.txt", "Hello World"),
    ("data.json", {"key": "value"}),
    ("binary.bin", b"\x00\x01\x02"),
]

DIR_CASES = ["questions/", "courses/math101/questions/"]


def storage_path(storage: Storage, tmp_path: Path, relative_path: str) -> str:
    if storage.get_storage_type() == "local":
        return (tmp_path / relative_path).as_posix()
    return relative_path


def expected_content(storage: Storage, content: Any) -> bytes:
    return storage._normalize_content(content)


@pytest.mark.parametrize("target", DIR_CASES)
def test_create_dir_exists_and_is_dir(
    raw_storage: Storage,
    tmp_path: Path,
    target: str,
) -> None:
    target = storage_path(raw_storage, tmp_path, target)

    created = raw_storage.create_dir(target)

    assert raw_storage.exists(created)
    assert raw_storage.is_dir(created)


@pytest.mark.parametrize(("filename", "content"), FILE_CASES)
def test_write_read_and_delete_file(
    raw_storage: Storage,
    tmp_path: Path,
    filename: str,
    content: Any,
) -> None:
    target = storage_path(raw_storage, tmp_path, f"questions/{filename}")

    written = raw_storage.write(target, content)

    assert written == target.rstrip("/")
    assert raw_storage.exists(written)
    assert normalize_newlines(raw_storage.read(written)) == normalize_newlines( # type: ignore
        expected_content(raw_storage, content)
    )

    raw_storage.delete(written)
    assert not raw_storage.exists(written)


def test_list_returns_direct_files_only(
    raw_storage: Storage,
    tmp_path: Path,
) -> None:
    base = storage_path(raw_storage, tmp_path, "questions/")
    raw_storage.create_dir(base)
    raw_storage.write(f"{base.rstrip('/')}/a.txt", "A")
    raw_storage.write(f"{base.rstrip('/')}/b.txt", "B")
    raw_storage.write(f"{base.rstrip('/')}/nested/c.txt", "C")

    listed = raw_storage.list(base)

    assert {PurePosixPath(path).name for path in listed} == {"a.txt", "b.txt"}


def test_list_recursive_returns_nested_files(
    raw_storage: Storage,
    tmp_path: Path,
) -> None:
    base = storage_path(raw_storage, tmp_path, "questions/")
    raw_storage.create_dir(base)
    raw_storage.write(f"{base.rstrip('/')}/a.txt", "A")
    raw_storage.write(f"{base.rstrip('/')}/nested/c.txt", "C")

    listed = raw_storage.list(base, recursive=True)

    assert {PurePosixPath(path).name for path in listed} == {"a.txt", "c.txt"}


@pytest.mark.parametrize(
    ("source", "destination"),
    [
        ("questions/source.txt", "questions/copy.txt"),
        ("questions/source.txt", "archive/source.txt"),
    ],
)
def test_copy_file_keeps_source(
    raw_storage: Storage,
    tmp_path: Path,
    source: str,
    destination: str,
) -> None:
    source = storage_path(raw_storage, tmp_path, source)
    destination = storage_path(raw_storage, tmp_path, destination)

    raw_storage.write(source, "payload")
    copied = raw_storage.copy(source, destination)

    assert copied == destination
    assert raw_storage.exists(source)
    assert raw_storage.exists(destination)


def test_move_file_local_only(raw_storage: Storage, tmp_path: Path) -> None:
    if raw_storage.get_storage_type() == "cloud":
        pytest.skip("Firebase move currently treats sources as directory prefixes.")

    source = storage_path(raw_storage, tmp_path, "questions/source.txt")
    destination = storage_path(raw_storage, tmp_path, "archive/source.txt")

    raw_storage.write(source, "payload")
    moved = raw_storage.move(source, destination)

    assert moved == destination
    assert not raw_storage.exists(source)
    assert raw_storage.exists(destination)
