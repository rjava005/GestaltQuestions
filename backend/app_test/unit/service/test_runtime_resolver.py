"""Runtime inference from bundle file conventions.

A question whose files resolve to no default runtime cannot be run without an
explicit ?language=, which surfaces as a 500 from
``POST /questions/{qid}/runtimes/run``.
"""

import pytest

from backend.question_runtime.model import RuntimeLanguage
from backend.question_runtime.service.runtime_resolver import (
    QuestionRunTimeResolver,
)

PY_SOURCE = "def generate():\n    return {}\n"
JS_SOURCE = "function generate(){return {};}\nmodule.exports={generate};\n"


def _defaults(files: dict[str, str]) -> list[RuntimeLanguage]:
    return [
        runtime.language
        for runtime in QuestionRunTimeResolver().infer(files)
        if runtime.is_default
    ]


def test_python_only_bundle_resolves_python_as_default() -> None:
    assert _defaults({"server.py": PY_SOURCE}) == [RuntimeLanguage.PYTHON]


def test_javascript_only_bundle_resolves_javascript_as_default() -> None:
    assert _defaults({"server.js": JS_SOURCE}) == [RuntimeLanguage.JAVASCRIPT]


def test_javascript_wins_when_a_bundle_ships_both_runtimes() -> None:
    """Matches the bundle importer, which also prefers server.js."""
    assert _defaults({"server.py": PY_SOURCE, "server.js": JS_SOURCE}) == [
        RuntimeLanguage.JAVASCRIPT
    ]


@pytest.mark.parametrize(
    "files",
    [
        {"server.py": PY_SOURCE},
        {"server.js": JS_SOURCE},
        {"server.py": PY_SOURCE, "server.js": JS_SOURCE},
    ],
)
def test_every_bundle_resolves_exactly_one_default(files: dict[str, str]) -> None:
    assert len(_defaults(files)) == 1
