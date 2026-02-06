from contextlib import asynccontextmanager
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app_test.shared.factories import (
    make_bad_question_web,
    make_delete_question,
    make_question_web,
    make_retrieve_question,
    make_retrieve_question_full,
    make_question_with_files,
    make_upload_files_to_question
)
from app_test.shared.mock_data import QUESTION_FULL,QUESTIONS_FULL

from src.core import get_session
from src.main import get_application
from src.types import FileData
from src.web.dependencies import (
    get_question_manager,
    get_storage_manager,
    get_storage_type,
)


@pytest.fixture
def question_payload():
    return QUESTION_FULL


@pytest.fixture
def multiple_question_payloads():
    return QUESTIONS_FULL


@asynccontextmanager
async def on_startup_test(app: FastAPI):
    """Async startup context for tests (skips DB initialization)."""
    yield


@pytest.fixture(scope="function")
def api_client(
    db_session,
    question_manager,
    active_storage_backend,
    storage_mode,
):
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
        yield active_storage_backend

    async def override_storage_mode():
        yield storage_mode

    app.dependency_overrides[get_session] = override_get_db
    app.dependency_overrides[get_question_manager] = override_get_question_manager
    app.dependency_overrides[get_storage_manager] = override_get_storage
    app.dependency_overrides[get_storage_type] = override_storage_mode

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
