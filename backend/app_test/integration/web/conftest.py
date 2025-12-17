from pathlib import Path
import pytest
from src.api.models import FileData


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
