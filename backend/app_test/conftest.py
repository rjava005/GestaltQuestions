from contextlib import asynccontextmanager
from typing import List

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine

from app_test.shared.fixtures.fixture_crud import *

from src.core import (
    get_settings,
    in_test_ctx,
    initialize_firebase_app,
    logger,
    get_session,
    Base,
)
from src.main import get_application
from src.service import (
    FirebaseStorage,
    LocalStorageService,
    StorageService,
    get_storage_manager,
    get_question_manager,
    QuestionManager,
)
from src.data import QuestionDB
from src.service import QuestionManager
from src.types import FileData, QuestionBase
from src.web.dependencies import get_STORAGE_TYPE


settings = get_settings()
initialize_firebase_app()


# DATA Fixtures
@pytest.fixture
def question_db(db_session) -> QuestionDB:
    return QuestionDB(db_session)


# SERVICE FIXTURES


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


@pytest.fixture(scope="function")
def question_manager(
    storage_mode,
    cloud_storage_service,
    local_storage,
    question_db,
):
    """
    Provides a configured QuestionManager based on the active storage backend.
    """
    if storage_mode == "cloud":
        storage = cloud_storage_service
    elif storage_mode == "local":
        storage = local_storage
    else:
        raise ValueError(f"Invalid storage type: {storage_mode}")

    return QuestionManager(
        question_db,
        storage,
        storage_mode,
    )


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

    async def override_get_storage():
        yield active_storage_backend

    async def override_storage_mode():
        yield storage_mode

    app.dependency_overrides[get_session] = override_get_db
    app.dependency_overrides[get_question_manager] = override_get_question_manager
    app.dependency_overrides[get_question_manager] = override_get_question_manager
    app.dependency_overrides[get_storage_manager] = override_get_storage
    app.dependency_overrides[get_STORAGE_TYPE] = override_storage_mode

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


@pytest.fixture
def question_payload():
    return {
        "title": "Sample Question",
        "ai_generated": True,
        "isAdaptive": False,
    }


@pytest.fixture
def question_payload_2():
    return QuestionBase(title="Question 2", ai_generated=False, isAdaptive=True)
