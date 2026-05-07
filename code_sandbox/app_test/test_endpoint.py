from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.main import get_app


@pytest.fixture(scope="function")
def test_client():
    """Provide a FastAPI TestClient instance."""
    app = get_app()
    with TestClient(app, raise_server_exceptions=True) as client:
        yield client


def _read_asset(asset_dir: Path, filename: str) -> str:
    return (asset_dir / filename).read_text(encoding="utf-8")


@pytest.fixture
def asset_dir(get_asset_path) -> Path:
    return get_asset_path


@pytest.fixture
def js_payload_without_utils(asset_dir: Path) -> dict:
    return {
        "entry": "server.js",
        "func_name": "generate",
        "language": "javascript",
        "files": {"server.js": _read_asset(asset_dir, "mock_entry.js")},
    }


@pytest.fixture
def js_payload_with_utils(asset_dir: Path) -> dict:
    return {
        "entry": "server.js",
        "func_name": "generate",
        "language": "javascript",
        "files": {
            "server.js": _read_asset(asset_dir, "mock_entry_with_utils.js"),
            "utils.js": _read_asset(asset_dir, "utils.js"),
        },
    }


@pytest.fixture
def js_payload_custom_func(asset_dir: Path) -> dict:
    return {
        "entry": "server.js",
        "func_name": "run",
        "language": "javascript",
        "files": {"server.js": _read_asset(asset_dir, "mock_entry_run.js")},
    }


@pytest.fixture
def py_payload_without_utils(asset_dir: Path) -> dict:
    return {
        "entry": "server.py",
        "func_name": "generate",
        "language": "python",
        "files": {"server.py": _read_asset(asset_dir, "mock_entry.py")},
    }


@pytest.fixture
def py_payload_with_utils(asset_dir: Path) -> dict:
    return {
        "entry": "server.py",
        "func_name": "generate",
        "language": "python",
        "files": {
            "server.py": _read_asset(asset_dir, "mock_entry_with_utils.py"),
            "utils.py": _read_asset(asset_dir, "utils.py"),
        },
    }


@pytest.fixture
def py_payload_custom_func() -> dict:
    return {
        "entry": "server.py",
        "func_name": "run",
        "language": "python",
        "files": {
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
    }


@pytest.mark.parametrize(
    "payload_fixture,expected_source,expected_total",
    [
        ("js_payload_without_utils", "mock_entry.js", 5),
        ("js_payload_with_utils", "mock_entry_with_utils.js", 9),
        ("js_payload_custom_func", "mock_entry_run.js", 13),
        ("py_payload_without_utils", "mock_entry.py", 5),
        ("py_payload_with_utils", "mock_entry_with_utils.py", 9),
        ("py_payload_custom_func", "inline_custom_run", 17),
    ],
)
def test_generate_endpoint_executes_for_js_and_py_configs(
    test_client, request, payload_fixture, expected_source, expected_total
):
    payload = request.getfixturevalue(payload_fixture)
    resp = test_client.post("/code_runner/generate", json=payload)

    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert "output" in body
    assert "logs" in body
    assert isinstance(body["output"], dict)
    assert isinstance(body["logs"], list)

    assert body["output"]["source"] == expected_source
    assert body["output"]["total"] == expected_total
