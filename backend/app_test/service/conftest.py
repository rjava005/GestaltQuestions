import os
from typing import List

import firebase_admin
import pytest
from app_test import FbStorage, LocalStorage, QuestionManager, initialize_firebase_app
from app_test.shared.mock_data import (
    QUESTIONS,
)
from src.model.files import FileData
from src.core import get_settings

# Keep these imports for the factory
from app_test.shared.factories.storage_factory import create_dir_factory
from app_test.shared.factories.question_manager_factory import make_question_qm


settings = get_settings()


@pytest.fixture(scope="session")
def firebase_app_for_tests():
    assert os.environ.get(
        "FIREBASE_AUTH_EMULATOR_HOST"
    ), "Missing FIREBASE_AUTH_EMULATOR_HOST"
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


@pytest.fixture
def question_manager(storage, question_db):
    return QuestionManager(question_db, storage)


@pytest.fixture
def question_file_payload() -> List[FileData]:
    files_data = [
        ("question.html", "Some question text"),
        ("solution.html", "Some solution"),
        ("server.js", "some code content"),
        ("meta.json", {"content": "some content"}),
    ]
    return [FileData(filename=f[0], content=f[1]) for f in files_data]
