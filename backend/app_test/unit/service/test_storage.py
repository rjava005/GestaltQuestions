import os

import firebase_admin
import pytest

from app_test import FbStorage, LocalStorage, initialize_firebase_app
from app_test.unit.shared import MOCK_FILES, RENAME_TARGETS, TARGETS
from src.core import get_settings
from src.utils import normalize, normalize_newlines


settings = get_settings()


@pytest.fixture(scope="session")
def firebase_app_for_tests():
    assert os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"), (
        "Missing FIREBASE_AUTH_EMULATOR_HOST"
    )
    assert os.environ.get("STORAGE_EMULATOR_HOST"), "Missing STORAGE_EMULATOR_HOST"

    app = initialize_firebase_app()
    yield app

    try:
        firebase_admin.delete_app(app)
    except Exception:
        pass
    initialize_firebase_app.cache_clear()


@pytest.fixture(
    params=[
        ("local", LocalStorage),
        ("cloud", FbStorage),
    ]
)
def storage(request, firebase_app_for_tests):
    _, StorageClass = request.param

    if StorageClass is FbStorage:
        return StorageClass(settings.STORAGE_BUCKET)
    return StorageClass()


@pytest.fixture(autouse=True)
def clean_cloud(storage):
    if storage.get_storage_type() == "cloud":
        storage._hard_delete()


def _path_for_storage(storage, tmp_path, relative_path: str) -> str:
    if storage.get_storage_type() == "local":
        return (tmp_path / relative_path).as_posix()
    return relative_path


@pytest.mark.parametrize("target", TARGETS)
def test_create_dir_and_exists(storage, tmp_path, target):
    target_path = _path_for_storage(storage, tmp_path, target)
    created = storage.create_dir(target_path)

    assert storage.exists(created)
    assert storage.is_dir(created)


@pytest.mark.parametrize("target", TARGETS)
def test_exists_false_for_missing_target(storage, tmp_path, target):
    target_path = _path_for_storage(storage, tmp_path, target)
    assert not storage.exists(target_path)


@pytest.mark.parametrize("filename,content", MOCK_FILES)
def test_write_and_read(storage, tmp_path, filename, content):
    target = _path_for_storage(storage, tmp_path, f"questions/test/{filename}")

    storage.write(target, content, overwrite=True)
    assert storage.exists(target)

    raw_bytes = storage.read(target)
    assert raw_bytes is not None
    assert normalize_newlines(raw_bytes) == normalize_newlines(normalize(content))


@pytest.mark.parametrize("filename,content", MOCK_FILES)
def test_delete(storage, tmp_path, filename, content):
    target = _path_for_storage(storage, tmp_path, f"questions/delete/{filename}")

    storage.write(target, content, overwrite=True)
    assert storage.exists(target)

    storage.delete(target)
    assert not storage.exists(target)


FILE_RENAME_CASES = [
    (source, destination)
    for source, destination in RENAME_TARGETS
    if not source.endswith("/") and not destination.endswith("/")
]


@pytest.mark.parametrize("source,destination", FILE_RENAME_CASES)
def test_copy_file(source, destination, storage, tmp_path):
    source_path = _path_for_storage(storage, tmp_path, source)
    destination_path = _path_for_storage(storage, tmp_path, destination)

    storage.write(source_path, "payload", overwrite=True)
    storage.copy(source=source_path, destination=destination_path)

    assert storage.exists(source_path)
    assert storage.exists(destination_path)


@pytest.mark.parametrize("source,destination", FILE_RENAME_CASES)
def test_move_file_local_only(source, destination, storage, tmp_path):
    if storage.get_storage_type() == "cloud":
        pytest.skip("Cloud move is directory-oriented in current implementation.")

    source_path = _path_for_storage(storage, tmp_path, source)
    destination_path = _path_for_storage(storage, tmp_path, destination)

    storage.write(source_path, "payload", overwrite=True)
    storage.move(source=source_path, destination=destination_path)

    assert not storage.exists(source_path)
    assert storage.exists(destination_path)
