import contextlib
import os
from collections.abc import Generator
from typing import Any
from backend.chat import model
import firebase_admin
import pytest
from sqlmodel import Session, SQLModel, create_engine

from backend.core import initialize_firebase_app
from backend.core.logging import (
    in_test_ctx,
    logger,
)
from backend.question import QuestionDB
from backend.question.services.qtype import QuestionQTypeDB

# ===== Database Fixtures =========================================================


# ===== Engine Fixtures ===========================================================
@pytest.fixture(scope="function")
def test_engine(tmp_path):
    """Provide a temporary SQLite engine for testing."""
    url = f"sqlite:///{tmp_path}/test.db"
    engine = create_engine(
        url,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


# ===== Session & Isolation Fixtures ==============================================
@pytest.fixture(scope="function")
def db_session(test_engine):
    """Provide a new SQLModel session for each test with isolation."""
    with Session(test_engine, expire_on_commit=False) as session:
        yield session

        session.rollback()


@pytest.fixture(autouse=True)
def _clean_db(db_session, test_engine) -> None:
    """Automatically reset database tables between tests."""
    logger.debug("Cleaning Database")
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)


@pytest.fixture()
def seed_qtypes(db_session):
    QuestionQTypeDB(db_session).seed_types()


@pytest.fixture
def question_db(db_session, seed_qtypes) -> QuestionDB:
    return QuestionDB(db_session)


# ===== Logging / Test Context Fixtures ===========================================
@pytest.fixture(autouse=True)
def mark_logs_in_test():
    """Mark logs as being inside test context for duration of each test."""
    token = in_test_ctx.set(True)
    yield
    in_test_ctx.reset(token)


# Firebase 
def normalize_storage_emulator_host()->bool:
    host = os.environ.get("STORAGE_EMULATOR_HOST")
    if not host or host == "...":
        return False
    if not host.startswith(("http://", "https://")):
        os.environ["STORAGE_EMULATOR_HOST"] = f"http://{host}"
    return True

def storage_params()-> list[str]:
    firebase_enabled = (
        os.environ.get("RUN_FIREBASE_STORAGE_TESTS") == "1"
        and os.environ.get("FIREBASE_AUTH_EMULATOR_HOST")
        and normalize_storage_emulator_host()
    )
    if firebase_enabled:
        return ["local", "cloud"]
    return ["local"]

@pytest.fixture(scope="session")
def firebase_app_for_tests() -> Generator[Any]:
    if not os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"):
        pytest.skip("Firebase auth emulator is not configured.")

    app = initialize_firebase_app()
    yield app

    with contextlib.suppress(Exception):
        firebase_admin.delete_app(app)
    initialize_firebase_app.cache_clear()
