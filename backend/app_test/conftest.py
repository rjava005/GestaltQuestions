import pytest
from sqlmodel import SQLModel, Session, create_engine


from src.core import (
    in_test_ctx,
    logger,
)
from src.data.question import QuestionDB


# ===== Database Fixtures =========================================================
@pytest.fixture
def question_db(db_session) -> QuestionDB:
    return QuestionDB(db_session)


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
def _clean_db(db_session, test_engine):
    """Automatically reset database tables between tests."""
    logger.debug("Cleaning Database")
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)


# ===== Logging / Test Context Fixtures ===========================================
@pytest.fixture(autouse=True)
def mark_logs_in_test():
    """Mark logs as being inside test context for duration of each test."""
    token = in_test_ctx.set(True)
    yield
    in_test_ctx.reset(token)
