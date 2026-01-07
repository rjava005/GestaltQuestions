# --- Standard Library ---
from pathlib import Path

# --- Third-Party ---
import pytest

# --- Local Modules ---
from code_sandbox.code_runner.javascript_runner import JavaScriptRunner
from code_sandbox.code_runner.models import ExecutionResult
from code_sandbox.utils import logs_contain


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #


@pytest.fixture
def js_execution_result(js_script_path):
    """Run the JavaScript file and return a validated ExecutionResult."""
    code = Path(js_script_path).read_text()
    runner = JavaScriptRunner()
    raw_result = runner.run(code)

    response = ExecutionResult.model_validate(raw_result)
    assert response is not None

    return response


# --------------------------------------------------------------------------- #
# Tests
# --------------------------------------------------------------------------- #


def test_js_execution_success(js_execution_result):
    """Verify the JavaScript successfully executes and validates."""
    resp = js_execution_result
    assert ExecutionResult.model_validate(resp)
    assert resp is not None


def test_js_execution_returns_quiz_response(js_execution_result):
    """Verify that the JavaScript returns correctly structured output."""
    output = js_execution_result.output

    assert isinstance(output, dict)
    assert output

    assert output["params"] == {"a": 1, "b": 2}
    assert output["correct_answers"]["sum"] == 3


def test_js_execution_logs_expected_output(js_execution_result):
    """Verify console logs include expected values and structures."""
    logs = js_execution_result.logs

    # Basic value logs
    assert logs_contain(logs, "This is the value of a", "1")
    assert logs_contain(logs, "This is the value of b", "2")

    # Structure logs (at least one format must match)
    assert logs_contain(logs, "Here is a structure")
    assert logs_contain(
        logs, "Here is a structure", '"a"', "1"
    ) or logs_contain(  # JSON-like
        logs, "Here is a structure", "a", "1"
    )  # fallback
