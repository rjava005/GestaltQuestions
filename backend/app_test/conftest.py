import pytest
from sqlmodel import Session, create_engine

from app_test.shared.fixtures.fixture_crud import *

from src.core import (
    get_settings,
    in_test_ctx,
    initialize_firebase_app,
    logger,
    Base,
)
from src.service import (
    FirebaseStorage,
    LocalStorageService,
    StorageService,
    QuestionManager,
)
from src.data import QuestionDB
from src.service import QuestionManager


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


@pytest.fixture(scope="function", params=["local", "cloud"])
def storage_mode(request) -> Literal["local", "cloud"]:
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


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def mark_logs_in_test():
    """Mark logs as being inside test context for duration of each test."""
    token = in_test_ctx.set(True)
    yield
    in_test_ctx.reset(token)
