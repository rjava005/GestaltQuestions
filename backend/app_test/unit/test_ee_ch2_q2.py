import importlib.util
import json
import math
import subprocess
from pathlib import Path
from types import ModuleType

import pytest

QUESTION_DIR = Path(__file__).parents[2] / "questions" / "EE_CH2_Q2"


def _load_python_generator() -> ModuleType:
    spec = importlib.util.spec_from_file_location(
        "ee_ch2_q2_server", QUESTION_DIR / "server.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _run_javascript(argument: object) -> dict:
    script = (
        "const {generate}=require('./server.js');"
        f"console.log(JSON.stringify(generate({json.dumps(argument)})));"
    )
    result = subprocess.run(
        ["node", "-e", script],
        cwd=QUESTION_DIR,
        capture_output=True,
        check=True,
        text=True,
    )
    return json.loads(result.stdout)


@pytest.mark.parametrize(
    ("previous", "expected"),
    [("lowPass", "highPass"), ("highPass", "lowPass")],
)
def test_generator_excludes_previous_variant(previous: str, expected: str) -> None:
    server = _load_python_generator()

    for _ in range(20):
        output = server.generate({"previousCircuitVariant": previous})
        assert output["params"]["circuitVariant"] == expected


def test_generator_ranges_and_sallen_key_constraints() -> None:
    server = _load_python_generator()

    for _ in range(100):
        output = server.generate()
        params = output["params"]
        assert params["R1"] == params["R2"]
        assert params["C1"] == params["C2"]
        assert 1.25 <= params["K"] <= 2.0
        assert params["K"] < 3
        assert 0.2 <= params["frequencyRatio"] <= 5.0
        assert -180 <= output["correct_answers"]["phaseShift"] < 180
        assert math.isfinite(output["correct_answers"]["gain"])


@pytest.mark.parametrize(
    "context",
    [
        {"usePredefinedValues": True, "previousCircuitVariant": "highPass"},
        {"usePredefinedValues": True, "previousCircuitVariant": "lowPass"},
    ],
)
def test_python_javascript_predefined_formula_parity(context: dict) -> None:
    server = _load_python_generator()

    python_output = server.generate(context)
    javascript_output = _run_javascript(context)

    assert (
        javascript_output["params"]["circuitVariant"]
        == python_output["params"]["circuitVariant"]
    )
    assert javascript_output["correct_answers"] == python_output["correct_answers"]


def test_predefined_response_matches_canonical_formula() -> None:
    server = _load_python_generator()
    output = server.generate(True)

    assert output["params"]["circuitVariant"] == "lowPass"
    assert output["correct_answers"] == {"gain": 0.354, "phaseShift": -135.0}
    with pytest.raises(ValueError, match="non-finite"):
        server._round_significant(math.inf)
