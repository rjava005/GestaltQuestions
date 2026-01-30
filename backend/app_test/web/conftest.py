from contextlib import asynccontextmanager
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.main import get_application

from src.types import FileData
from src.web.dependencies import get_storage_type, get_question_manager,get_storage_manager
from src.core import get_session


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


#  OLD
@pytest.fixture
def question_data():
    """Minimal question payload."""
    return {
        "title": "SomeTitle",
        "ai_generated": True,
        "isAdaptive": True,
        "createdBy": "John Doe",
        "user_id": 1,
    }


@pytest.fixture
def server_files():
    """Static assets used by question endpoints."""
    base = Path("app_test/test_assets/code")
    return [
        FileData(filename="server.js", content=(base / "generate.js").read_bytes()),
        FileData(filename="server.py", content=(base / "generate.py").read_bytes()),
    ]


@pytest.fixture
def qpayload_bad():
    return {"Data": "Some Content"}


@pytest.fixture
def question_payload():
    """Minimal question payload with required fields only."""
    return {
        "title": "SomeTitle",
        "ai_generated": True,
        "isAdaptive": True,
    }


@pytest.fixture
def question_payload_thermo():
    """Thermodynamics question payload with metadata."""
    return {
        "title": "Thermodynamics First Law",
        "ai_generated": False,
        "isAdaptive": False,
        "topics": ["Thermodynamics", "Energy Balance"],
        "languages": ["python", "javascript"],
        "qtype": ["conceptual"],
    }


@pytest.fixture
def question_payload_fluids():
    """Fluid dynamics question payload with metadata."""
    return {
        "title": "Bernoulli Equation",
        "ai_generated": True,
        "isAdaptive": True,
        "topics": ["Fluid Dynamics", "Flow Analysis"],
        "languages": ["javascript"],
        "qtype": ["multiple-choice"],
    }


@pytest.fixture
def create_question_web(api_client, question_payload):
    """POST a minimal valid question payload to /questions/."""
    return api_client.post("/questions/", json=question_payload)


@pytest.fixture
def create_question_bad_payload_response(api_client, qpayload_bad):
    """POST an invalid question payload to /questions/."""
    return api_client.post("/questions/", json=qpayload_bad)


@pytest.fixture
def multi_payload_questions(
    question_payload, question_payload_thermo, question_payload_fluids
):
    return [question_payload, question_payload_fluids, question_payload_thermo]
