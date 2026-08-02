import math

import pytest

from gestalt_signal_systems import (
    MathJsonError,
    continuous_signal,
    convolve_discrete,
    feedback,
    finite_json,
    grade_answer,
    grade_answers,
    mathjson_to_sympy,
    series,
    time_response,
    transfer_function,
)


def test_signal_sampling_convolution_and_limits():
    signal = continuous_signal(lambda values: values**2, -1, 1, count=5)
    assert signal["y"] == [1.0, 0.25, 0.0, 0.25, 1.0]
    assert convolve_discrete([1, 2], [1, 1]) == [1, 3, 2]
    with pytest.raises(ValueError):
        continuous_signal(lambda values: values, 0, 1, count=10_001)
    with pytest.raises(ValueError):
        finite_json([math.inf])


def test_transfer_function_interconnections_and_response():
    plant = transfer_function([1], [1, 1])
    loop = series(transfer_function([2], [1]), plant)
    closed = feedback(loop)
    response = time_response(closed, [0, 0.5, 1])
    assert len(response["time"]) == len(response["output"]) == 3
    assert response["output"][-1] > response["output"][0]


def test_symbolic_calculus_and_unauthorized_mathjson():
    symbolic = {"type": "symbolic", "allowed_variables": ["x"]}
    assert (
        grade_answer(["Add", "x", 1], ["Add", 1, "x"], symbolic)["status"] == "correct"
    )
    calculus = {
        "type": "calculus",
        "bound_variables": ["t"],
        "calculus_operations": ["Integrate", "Limit", "Derivative", "Sum"],
    }
    integral = ["Integrate", "t", ["Tuple", "t", 0, 1]]
    assert grade_answer(integral, {"num": "1/2"}, calculus)["status"] == "correct"
    assert grade_answer(["Sin", "x"], 0, symbolic)["status"] == "invalid"
    with pytest.raises(MathJsonError):
        mathjson_to_sympy(
            ["Power", "x", ["Power", "x", ["Power", "x", "x"]]],
            {**symbolic, "max_depth": 2},
        )


def test_per_slot_and_numeric_grading():
    private = {
        "answer_specs": {
            "gain": {"type": "numeric", "absolute_tolerance": 0.01, "units": "V"},
            "form": {"type": "transfer_function", "allowed_variables": ["s"]},
        },
        "correct_answers": {"gain": 2, "form": ["Divide", 1, ["Add", "s", 1]]},
    }
    result = grade_answers(
        {
            "gain": {"value": "2.005", "units": "V"},
            "form": ["Divide", 2, ["Multiply", 2, ["Add", "s", 1]]],
        },
        private,
    )
    assert result["overall"] == "correct"
    assert set(result["slots"]) == {"gain", "form"}
