"""Bounded python-control wrappers for authored questions."""

from collections.abc import Iterable
from typing import Any, Literal

import control as ct
import numpy as np

from .serialization import finite_json
from .signals import MAX_SAMPLES


def _grid(values: Iterable[float], name: str, minimum: int = 1) -> np.ndarray:
    result = np.asarray(list(values), dtype=float)
    if (
        result.ndim != 1
        or not minimum <= result.size <= MAX_SAMPLES
        or not np.isfinite(result).all()
    ):
        raise ValueError(
            f"{name} must contain {minimum} to {MAX_SAMPLES} finite values."
        )
    return result


def transfer_function(
    numerator: Iterable[float],
    denominator: Iterable[float],
    *,
    dt: float | bool | None = None,
) -> ct.TransferFunction:
    num, den = (
        _grid(numerator, "Numerator").tolist(),
        _grid(denominator, "Denominator").tolist(),
    )
    if len(num) > 128 or len(den) > 128 or not any(den):
        raise ValueError("Transfer-function coefficients are invalid.")
    if dt is not None and dt is not True and (not np.isfinite(dt) or dt <= 0):
        raise ValueError("Discrete sample time must be positive and finite.")
    return ct.tf(num, den, dt) if dt is not None else ct.tf(num, den)


def series(*systems: Any) -> Any:
    if not systems:
        raise ValueError("Series needs at least one system.")
    return ct.series(*systems)


def parallel(*systems: Any) -> Any:
    if not systems:
        raise ValueError("Parallel needs at least one system.")
    return ct.parallel(*systems)


def feedback(system: Any, feedback_system: Any = 1, *, sign: int = -1) -> Any:
    if sign not in {-1, 1}:
        raise ValueError("Feedback sign must be -1 or 1.")
    return ct.feedback(system, feedback_system, sign=sign)


def time_response(
    system: Any,
    time: Iterable[float],
    *,
    kind: Literal["step", "impulse", "initial", "forced"] = "step",
    input_values: Iterable[float] | None = None,
    initial_state: Any = 0,
) -> dict[str, Any]:
    t = _grid(time, "Time", 2)
    if np.any(np.diff(t) <= 0):
        raise ValueError("Time must be strictly increasing.")
    if kind == "step":
        response = ct.step_response(system, T=t)
    elif kind == "impulse":
        response = ct.impulse_response(system, T=t)
    elif kind == "initial":
        response = ct.initial_response(system, T=t, X0=initial_state)
    else:
        if input_values is None:
            raise ValueError("Forced response requires input_values.")
        inputs = _grid(input_values, "Input", 2)
        if inputs.shape != t.shape:
            raise ValueError("Input must match the time vector.")
        response = ct.forced_response(system, T=t, U=inputs, X0=initial_state)
    return finite_json({"time": response.time, "output": response.outputs})


def frequency_response(system: Any, omega: Iterable[float]) -> dict[str, Any]:
    frequencies = _grid(omega, "Frequency", 2)
    if np.any(frequencies <= 0):
        raise ValueError("Frequencies must be positive.")
    response = ct.frequency_response(system, frequencies)
    return finite_json(
        {
            "omega": response.omega,
            "magnitude": response.magnitude,
            "phase": response.phase,
        }
    )
