# --- Standard Library ---
from pathlib import Path

# --- Third-Party ---
import pytest

# --- Local Modules ---
from src.services.code_runner.javascript_runner import JavaScriptRunner
from src.services.code_runner.models import ExecutionResult, RuntimeExecutionConfig


def _read_asset(asset_dir: Path, filename: str) -> str:
    return (asset_dir / filename).read_text(encoding="utf-8")


@pytest.fixture
def asset_dir(get_asset_path) -> Path:
    return get_asset_path


@pytest.fixture
def js_config_without_utils(asset_dir: Path) -> RuntimeExecutionConfig:
    return RuntimeExecutionConfig(
        entry="server.js",
        language="javascript",
        files={"server.js": _read_asset(asset_dir, "mock_entry.js")},
    )


@pytest.fixture
def js_config_with_utils(asset_dir: Path) -> RuntimeExecutionConfig:
    return RuntimeExecutionConfig(
        entry="server.js",
        language="javascript",
        files={
            "server.js": _read_asset(asset_dir, "mock_entry_with_utils.js"),
            "utils.js": _read_asset(asset_dir, "utils.js"),
        },
    )


@pytest.fixture
def js_config_custom_func(asset_dir: Path) -> RuntimeExecutionConfig:
    return RuntimeExecutionConfig(
        entry="server.js",
        func_name="run",
        language="javascript",
        files={"server.js": _read_asset(asset_dir, "mock_entry_run.js")},
    )


def test_js_execution_without_utils(js_config_without_utils: RuntimeExecutionConfig):
    runner = JavaScriptRunner(js_config_without_utils)
    response = ExecutionResult.model_validate(runner.run())

    assert response is not None
    assert isinstance(response.output, dict)
    assert response.output["source"] == "mock_entry.js"
    assert response.output["values"] == {"a": 2, "b": 3}
    assert response.output["total"] == 5
    assert any("mock js no import" in log for log in response.logs)


def test_js_execution_with_utils(js_config_with_utils: RuntimeExecutionConfig):
    runner = JavaScriptRunner(js_config_with_utils)
    response = ExecutionResult.model_validate(runner.run())

    assert response is not None
    assert isinstance(response.output, dict)
    assert response.output["source"] == "mock_entry_with_utils.js"
    assert response.output["values"] == {"a": 4, "b": 5}
    assert response.output["total"] == 9
    assert response.output["message"] == "4 + 5 = 9"
    assert any("mock js with utils" in log for log in response.logs)


def test_js_execution_with_custom_function(
    js_config_custom_func: RuntimeExecutionConfig,
):
    runner = JavaScriptRunner(js_config_custom_func)
    response = ExecutionResult.model_validate(runner.run())

    assert response is not None
    assert isinstance(response.output, dict)
    assert response.output["source"] == "mock_entry_run.js"
    assert response.output["values"] == {"x": 6, "y": 7}
    assert response.output["total"] == 13
    assert any("mock js custom func" in log for log in response.logs)


# def test_failed_execution(js_bad_code_path):
#     bad_code = Path(js_bad_code_path).read_text(encoding="utf-8")
#     config = RuntimeExecutionConfig(
#         entry="server.js",
#         language="javascript",
#         files={"server.js": bad_code},
#     )

#     with pytest.raises(ExecutionError):
#         JavaScriptRunner(config).run()
