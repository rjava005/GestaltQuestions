from contextlib import asynccontextmanager
from typing import List

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from app_test.fixtures.fixture_crud import *
from src.api.core import logger, in_test_ctx
from src.api.core.config import get_settings
from src.api.database.database import Base, get_session
from src.api.main import get_application
from src.api.models import FileData
from src.storage.base import StorageService
from src.api.service.question_manager import (
    QuestionManager,
    get_question_manager,
)
from src.api.service.storage_manager import (
    get_storage_manager,
)
from src.api.initialize_firebase import initialize_firebase_app
from src.storage.firebase_storage import FirebaseStorage
from src.storage.local_storage import LocalStorageService
from src.api.service.question_resource import (
    QuestionResourceService,
    get_question_resource,
)
from src.api.dependencies import get_storage_type

settings = get_settings()
initialize_firebase_app()


@asynccontextmanager
async def on_startup_test(app: FastAPI):
    """Async startup context for tests (skips DB initialization)."""
    yield


# -----------------------------
# Database Fixtures
# -----------------------------
@pytest.fixture(scope="function")
def test_engine(tmp_path):
    """Provide a temporary SQLite engine for testing."""
    url = f"sqlite:///{tmp_path}/test.db"
    engine = create_engine(
        url,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Provide a new SQLModel session for each test with isolation."""
    with Session(test_engine, expire_on_commit=False) as session:
        yield session
        session.rollback()


@pytest.fixture(autouse=True)
def _clean_db(db_session, test_engine):
    """Automatically reset database tables between tests."""
    logger.debug("Cleaning Database")
    Base.metadata.drop_all(test_engine)
    Base.metadata.create_all(test_engine)


# -----------------------------
# Storage Fixtures
# -----------------------------
@pytest.fixture(scope="function")
def cloud_storage_service():
    """Provide a FirebaseStorage instance connected to the test bucket."""
    root = "test"
    base = "questions"
    return FirebaseStorage(settings.STORAGE_BUCKET, root=root, base=base)


@pytest.fixture(scope="function")
def local_storage(tmp_path):
    """Provide a LocalStorageService rooted in a temporary directory."""
    root = tmp_path
    base = "questions"
    return LocalStorageService(root, base="questions")


@pytest.fixture(autouse=True)
def clean_up_cloud(cloud_storage_service):
    """Clean up the test bucket after each test."""
    yield
    cloud_storage_service.hard_delete()
    logger.debug("Deleting Bucket - Cleaning Up")


# =========================================
# API Fixtures
# =========================================
@pytest.fixture(scope="session")
def app_instance():
    """Create the FastAPI app once for all tests."""
    app = get_application()
    app.router.lifespan_context = on_startup_test
    return app


@pytest.fixture(scope="function", params=["local", "cloud"])
def storage_mode(request):
    """
    Controls whether tests run against local or cloud-backed storage.
    """
    return request.param


@pytest.fixture(scope="function")
def active_storage_backend(
    storage_mode, cloud_storage_service, local_storage
) -> StorageService:
    """
    Selects the correct storage backend for a test run.
    """
    if storage_mode == "cloud":
        return cloud_storage_service
    if storage_mode == "local":
        return local_storage
    raise ValueError(f"Invalid storage type: {storage_mode}")


@pytest.fixture(scope="function")
def question_manager(db_session):
    """
    Provides a fresh QuestionManager for each test.
    """
    return QuestionManager(db_session)


@pytest.fixture(scope="function")
def question_resource(
    storage_mode,
    cloud_storage_service,
    local_storage,
    question_manager,
):
    """
    Provides a configured QuestionResourceService based on the active storage backend.
    """
    if storage_mode == "cloud":
        storage = cloud_storage_service
    elif storage_mode == "local":
        storage = local_storage
    else:
        raise ValueError(f"Invalid storage type: {storage_mode}")

    return QuestionResourceService(
        question_manager,
        storage,
        storage_mode,
    )


@pytest.fixture(scope="function")
def api_client(
    db_session,
    question_manager,
    question_resource,
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

    async def override_get_question_resource():
        yield question_resource

    async def override_get_storage():
        yield active_storage_backend

    async def override_storage_mode():
        yield storage_mode

    app.dependency_overrides[get_session] = override_get_db
    app.dependency_overrides[get_question_manager] = override_get_question_manager
    app.dependency_overrides[get_question_resource] = override_get_question_resource
    app.dependency_overrides[get_storage_manager] = override_get_storage
    app.dependency_overrides[get_storage_type] = override_storage_mode

    # --- Start test client ---
    with TestClient(app, raise_server_exceptions=True) as client:
        yield client


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def mark_logs_in_test():
    """Mark logs as being inside test context for duration of each test."""
    token = in_test_ctx.set(True)
    yield
    in_test_ctx.reset(token)


@pytest.fixture
def question_payload_full_dict():
    """Full question payload including topics, qtypes, and languages."""
    return {
        "title": "SomeTitle",
        "ai_generated": True,
        "isAdaptive": True,
        "topics": ["Topic1", "Topic2"],
        "qtype": ["Numerical", "Matrix"],
        "languages": ["Python", "Go", "Rust"],
    }


@pytest.fixture
def file_data_payload() -> List[FileData]:
    """Provide a list of FileData objects with string, dict, and binary content."""
    text_content = "Hello World"
    dict_content = {"key": "value", "number": 123}
    binary_content = b"\x00\x01\x02\x03"

    return [
        FileData(filename="Test.txt", content=text_content),
        FileData(filename="Config.json", content=dict_content),
        FileData(filename="Binary.bin", content=binary_content),
    ]


@pytest.fixture
def question_file_payload() -> List[FileData]:
    files_data = [
        ("question.html", "Some question text"),
        ("solution.html", "Some solution"),
        ("server.js", "some code content"),
        ("meta.json", {"content": "some content"}),
    ]
    return [FileData(filename=f[0], content=f[1]) for f in files_data]


@pytest.fixture
def question_additional_metadata():
    return {
        "topics": ["Mechanics", "Statics"],
        "languages": ["python", "javascript"],
        "qtype": ["numeric"],
    }
