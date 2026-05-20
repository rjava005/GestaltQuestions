import os
from contextlib import asynccontextmanager
from pathlib import Path

import firebase_admin
import pytest
from app_test import FbStorage, LocalStorage, QuestionManager, initialize_firebase_app
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app_test.shared.mock_data import QUESTIONS

from src.core import get_session, get_settings
from src.main import get_application
from src.model.files import FileData
from src.web.dependencies import (
    get_question_manager,
    get_storage_manager,
    get_storage_type,
    get_local_base_path,
)


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


@pytest.fixture
def question_manager(storage, question_db):
    return QuestionManager(question_db, storage)


@pytest.fixture
def question_payload():
    return QUESTIONS


@pytest.fixture
def multiple_question_payloads():
    return QUESTIONS


@asynccontextmanager
async def on_startup_test(app: FastAPI):
    """Async startup context for tests (skips DB initialization)."""
    yield


@pytest.fixture(scope="function")
def api_client(db_session, question_manager, storage, tmp_path):
    """
    Provides a FastAPI TestClient with dependency overrides for DB, storage,
    question manager, and resource service.
    """
    app = get_application()
    app.router.lifespan_context = on_startup_test

    # --- Dependency overrides ---
    def override_get_db():
        yield db_session

    async def override_get_question_manager():
        yield question_manager

    async def override_get_storage():
        yield storage

    async def override_storage_mode():
        yield storage.get_storage_type()

    async def override_local_base_path():
        yield (tmp_path / "test_questions").as_posix()

    app.dependency_overrides[get_session] = override_get_db
    app.dependency_overrides[get_question_manager] = override_get_question_manager
    app.dependency_overrides[get_storage_manager] = override_get_storage
    app.dependency_overrides[get_storage_type] = override_storage_mode
    app.dependency_overrides[get_local_base_path] = override_local_base_path

    # --- Start test client ---
    with TestClient(app, raise_server_exceptions=True) as client:
        yield client


@pytest.fixture
def server_files():
    """Static assets used by question endpoints."""
    base = Path("app_test/test_assets/code")
    return [
        FileData(filename="server.js", content=(base / "generate.js").read_bytes()),
        FileData(filename="server.py", content=(base / "generate.py").read_bytes()),
    ]
