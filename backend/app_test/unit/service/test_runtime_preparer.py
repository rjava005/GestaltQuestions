import json

import pytest
from backend.question_runtime import (
    ConfigurationError,
    InvalidEntryError,
    InvalidFilePayloadError,
    Language,
    RuntimeResolutionError,
)
from backend.question_runtime.service.prepare_runtime import RuntimePreparer


@pytest.fixture
def runtime_preparer() -> RuntimePreparer:
    return RuntimePreparer()


@pytest.fixture
def multi_runtime_files() -> dict[str, str]:
    return {
        "config.json": json.dumps(
            {
                "default_language": "python",
                "runtimes": {
                    "python": {
                        "entry": "server.py",
                        "func_name": "generate",
                        "language": "python",
                    },
                    "javascript": {
                        "entry": "server.js",
                        "func_name": "generate",
                        "language": "javascript",
                    },
                },
            }
        ),
        "server.py": "def generate(data):\n    return {'ok': True, 'lang': 'py'}\n",
        "server.js": "function generate(data) { return { ok: true, lang: 'js' }; }\nmodule.exports = { generate };\n",
        "helper.py": "VALUE = 42\n",
        "helper.js": "export const VALUE = 42;\n",
    }


@pytest.fixture
def multi_runtime_files_no_default() -> dict[str, str]:
    return {
        "config.json": json.dumps(
            {
                "runtimes": {
                    "python": {
                        "entry": "server.py",
                        "func_name": "generate",
                        "language": "python",
                    },
                    "javascript": {
                        "entry": "server.js",
                        "func_name": "generate",
                        "language": "javascript",
                    },
                },
            }
        ),
        "server.py": "def generate(data):\n    return {'ok': True, 'lang': 'py'}\n",
        "server.js": "function generate(data) { return { ok: true, lang: 'js' }; }\nmodule.exports = { generate };\n",
        "helper.py": "VALUE = 42\n",
        "helper.js": "export const VALUE = 42;\n",
    }


@pytest.fixture
def python_files_no_config() -> dict[str, str]:
    return {
        "server.py": "def generate(data):\n    return {'result': 123}\n",
        "utils.py": "def helper():\n    return 1\n",
    }


@pytest.fixture
def javascript_files_no_config() -> dict[str, str]:
    return {
        "server.js": "function generate(data) { return { result: 123 }; }\nmodule.exports = { generate };\n",
        "utils.js": "export const helper = () => 1;\n",
    }


@pytest.fixture
def python_config_missing_entry_files() -> dict[str, str]:
    return {
        "config.json": json.dumps(
            {
                "default_language": "python",
                "runtimes": {
                    "python": {
                        "entry": "server.py",
                        "func_name": "generate",
                        "language": "python",
                    }
                },
            }
        ),
        "helper.py": "VALUE = 42\n",
    }


@pytest.fixture
def javascript_config_missing_entry_files() -> dict[str, str]:
    return {
        "config.json": json.dumps(
            {
                "default_language": "javascript",
                "runtimes": {
                    "javascript": {
                        "entry": "server.js",
                        "func_name": "generate",
                        "language": "javascript",
                    }
                },
            }
        ),
        "helper.js": "const VALUE = 42;\n",
    }


@pytest.fixture
def config_missing_runtimes_key() -> dict[str, str]:
    return {
        "config.json": json.dumps(
            {
                "default_language": "python",
            }
        ),
        "server.py": "def generate(data):\n    return {'ok': True}\n",
    }


@pytest.fixture
def config_with_wrong_runtimes_key() -> dict[str, str]:
    return {
        "config.json": json.dumps(
            {
                "default_language": "python",
                "runtimez": {
                    "python": {
                        "entry": "server.py",
                        "func_name": "generate",
                        "language": "python",
                    }
                },
            }
        ),
        "server.py": "def generate(data):\n    return {'ok': True}\n",
    }


@pytest.fixture
def config_with_wrong_runtime_field_names() -> dict[str, str]:
    return {
        "config.json": json.dumps(
            {
                "default_language": "python",
                "runtimes": {
                    "python": {
                        "entrypoint": "server.py",
                        "function_name": "generate",
                        "language": "python",
                    }
                },
            }
        ),
        "server.py": "def generate(data):\n    return {'ok': True}\n",
    }


# Tests with config
@pytest.mark.parametrize(
    "config_fixture", ["multi_runtime_files", "multi_runtime_files_no_default"]
)
@pytest.mark.parametrize(
    "requested_language, expected_entry",
    [("javascript", "server.js"), ("python", "server.py")],
)
def test_prepare_runtime_with_config_uses_requested_language(
    request,
    runtime_preparer: RuntimePreparer,
    config_fixture: str,
    requested_language: Language,
    expected_entry: str,
) -> None:
    multi_runtime_files = request.getfixturevalue(config_fixture)
    runtime = runtime_preparer.prepare_runtime(
        multi_runtime_files, language=requested_language
    )

    assert runtime.language == requested_language
    assert runtime.entry == expected_entry
    assert runtime.func_name == "generate"
    assert runtime.files == multi_runtime_files


def test_prepare_runtime_with_config_uses_default_language(
    runtime_preparer: RuntimePreparer,
    multi_runtime_files: dict[str, str],
) -> None:
    runtime = runtime_preparer.prepare_runtime(multi_runtime_files)

    assert runtime.language == "python"
    assert runtime.entry == "server.py"
    assert runtime.func_name == "generate"
    assert runtime.files == multi_runtime_files


def test_prepare_runtime_with_config_raises_for_ambiguous_runtime_without_default(
    runtime_preparer: RuntimePreparer, multi_runtime_files_no_default
) -> None:
    with pytest.raises(RuntimeResolutionError, match="ambiguous"):
        runtime_preparer.prepare_runtime(multi_runtime_files_no_default)


@pytest.mark.parametrize(
    "payload_fixture, expected_entry",
    [
        ("python_config_missing_entry_files", "server.py"),
        ("javascript_config_missing_entry_files", "server.js"),
    ],
)
def test_prepare_runtime_raises_for_missing_entry_file(
    request,
    runtime_preparer: RuntimePreparer,
    payload_fixture: str,
    expected_entry: str,
) -> None:
    files = request.getfixturevalue(payload_fixture)

    with pytest.raises(InvalidEntryError, match=expected_entry):
        runtime_preparer.prepare_runtime(files)


@pytest.mark.parametrize(
    "payload_fixture",
    [
        "config_missing_runtimes_key",
        "config_with_wrong_runtimes_key",
        "config_with_wrong_runtime_field_names",
    ],
)
def test_prepare_runtime_with_config_raises_for_invalid_config_shape(
    request,
    runtime_preparer: RuntimePreparer,
    payload_fixture: str,
) -> None:
    files = request.getfixturevalue(payload_fixture)

    with pytest.raises(ConfigurationError, match="config.json"):
        runtime_preparer.prepare_runtime(files)


# Tests without config
@pytest.mark.parametrize(
    "requested_language, expected_entry, payload_fixture",
    [
        ("javascript", "server.js", "javascript_files_no_config"),
        ("python", "server.py", "python_files_no_config"),
    ],
)
def test_prepare_runtime_without_config_uses_requested_language(
    request,
    runtime_preparer: RuntimePreparer,
    requested_language: Language,
    expected_entry: str,
    payload_fixture: str,
) -> None:
    payload = request.getfixturevalue(payload_fixture)

    runtime = runtime_preparer.prepare_runtime(
        payload,
        language=requested_language,
    )

    assert runtime.language == requested_language
    assert runtime.entry == expected_entry
    assert runtime.func_name == "generate"
    assert runtime.files == payload


@pytest.mark.parametrize(
    "payload_fixture",
    [
        "javascript_files_no_config",
        "python_files_no_config",
    ],
)
def test_prepare_runtime_without_config_requires_language(
    request,
    runtime_preparer: RuntimePreparer,
    payload_fixture: str,
) -> None:
    payload = request.getfixturevalue(payload_fixture)
    with pytest.raises(
        RuntimeResolutionError, match="runtime language must be specified"
    ):
        runtime_preparer.prepare_runtime(payload)


def test_prepare_runtime_raises_for_empty_file_payload(
    runtime_preparer: RuntimePreparer,
) -> None:
    with pytest.raises(InvalidFilePayloadError, match="File payload is empty"):
        runtime_preparer.prepare_runtime({}, language="python")
