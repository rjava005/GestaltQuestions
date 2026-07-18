# --- Standard Library ---
from pathlib import Path

# --- Third-Party ---
import pytest

# --- Local Modules ---
from src.services.code_runner.error_handling import ExecutionError
from src.services.code_runner.models import ExecutionResult, RuntimeExecutionConfig
from src.services.code_runner.python_runner import PythonScriptRunner


def _read_asset(asset_dir: Path, filename: str) -> str:
    return (asset_dir / filename).read_text(encoding="utf-8")


@pytest.fixture
def asset_dir(get_asset_path) -> Path:
    return get_asset_path


@pytest.fixture
def py_config_without_utils(asset_dir: Path) -> RuntimeExecutionConfig:
    return RuntimeExecutionConfig(
        entry="server.py",
        language="python",
        files={"server.py": _read_asset(asset_dir, "mock_entry.py")},
    )


@pytest.fixture
def py_config_with_utils(asset_dir: Path) -> RuntimeExecutionConfig:
    return RuntimeExecutionConfig(
        entry="server.py",
        language="python",
        files={
            "server.py": _read_asset(asset_dir, "mock_entry_with_utils.py"),
            "utils.py": _read_asset(asset_dir, "utils.py"),
        },
    )


@pytest.fixture
def py_config_custom_func() -> RuntimeExecutionConfig:
    return RuntimeExecutionConfig(
        entry="server.py",
        func_name="run",
        language="python",
        files={
            "server.py": (
                "def run():\n"
                "    x = 8\n"
                "    y = 9\n"
                "    total = x + y\n"
                "    print('mock py custom func')\n"
                "    return {\n"
                "        'source': 'inline_custom_run',\n"
                "        'values': {'x': x, 'y': y},\n"
                "        'total': total,\n"
                "    }\n"
            )
        },
    )


def test_py_execution_without_utils(py_config_without_utils: RuntimeExecutionConfig):
    runner = PythonScriptRunner(py_config_without_utils)
    response = ExecutionResult.model_validate(runner.run())

    assert response is not None
    assert isinstance(response.output, dict)
    assert response.output["source"] == "mock_entry.py"
    assert response.output["values"] == {"a": 2, "b": 3}
    assert response.output["total"] == 5
    assert any("mock py no import" in log for log in response.logs)


def test_py_execution_with_utils(py_config_with_utils: RuntimeExecutionConfig):
    runner = PythonScriptRunner(py_config_with_utils)
    response = ExecutionResult.model_validate(runner.run())

    assert response is not None
    assert isinstance(response.output, dict)
    assert response.output["source"] == "mock_entry_with_utils.py"
    assert response.output["values"] == {"a": 4, "b": 5, "sum": 9}
    assert response.output["total"] == 9
    assert response.output["message"] == "4 + 5 = 9"
    assert any("mock py with utils" in log for log in response.logs)


def test_py_execution_with_custom_function(
    py_config_custom_func: RuntimeExecutionConfig,
):
    runner = PythonScriptRunner(py_config_custom_func)
    response = ExecutionResult.model_validate(runner.run())

    assert response is not None
    assert isinstance(response.output, dict)
    assert response.output["source"] == "inline_custom_run"
    assert response.output["values"] == {"x": 8, "y": 9}
    assert response.output["total"] == 17
    assert any("mock py custom func" in log for log in response.logs)


def test_failed_execution():
    bad_code = "def generate():\n    return not_defined_name\n"
    config = RuntimeExecutionConfig(
        entry="server.py",
        language="python",
        files={"server.py": bad_code},
    )

    with pytest.raises(ExecutionError):
        PythonScriptRunner(config).run()


def test_python_generation_context_is_forwarded():
    config = RuntimeExecutionConfig(
        entry="server.py",
        language="python",
        generation_context={"previousCircuitVariant": "lowPass"},
        files={"server.py": "def generate(context):\n    return context\n"},
    )

    response = PythonScriptRunner(config).run()

    assert response.output == {"previousCircuitVariant": "lowPass"}
