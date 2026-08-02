"""Bounded helpers for continuous and discrete signals."""

from collections.abc import Callable, Iterable, Sequence
from typing import Any

import numpy as np
import sympy as sp

MAX_SAMPLES = 10_000


def _array(values: Any, name: str) -> np.ndarray:
    result = np.asarray(values)
    if result.ndim != 1 or result.size > MAX_SAMPLES:
        raise ValueError(f"{name} must contain at most {MAX_SAMPLES} values.")
    if not np.all(np.isfinite(result.astype(complex))):
        raise ValueError(f"{name} must contain only finite values.")
    return result


def continuous_signal(
    function: Callable[[np.ndarray], Any],
    start: float,
    stop: float,
    *,
    count: int = 501,
) -> dict[str, Any]:
    if (
        isinstance(count, bool)
        or not isinstance(count, int)
        or not 2 <= count <= MAX_SAMPLES
    ):
        raise ValueError(f"Sample count must be between 2 and {MAX_SAMPLES}.")
    if not np.isfinite([start, stop]).all() or stop <= start:
        raise ValueError("Signal bounds must be finite and increasing.")
    x = np.linspace(start, stop, count)
    y = np.asarray(function(x))
    if y.ndim == 0:
        y = np.full_like(x, y, dtype=np.result_type(y, float))
    y = _array(y, "Signal values")
    if y.size != x.size:
        raise ValueError("Signal function must return one value per sample.")
    return {"kind": "continuous", "x": x.tolist(), "y": y.tolist()}


def discrete_signal(indices: Iterable[float], values: Iterable[Any]) -> dict[str, Any]:
    x, y = _array(list(indices), "Indices"), _array(list(values), "Values")
    if x.size != y.size:
        raise ValueError("Discrete indices and values must have equal lengths.")
    return {"kind": "discrete", "x": x.tolist(), "y": y.tolist()}


def sample_signal(
    function: Callable[[np.ndarray], Any], start: float, stop: float, *, period: float
) -> dict[str, Any]:
    if not np.isfinite(period) or period <= 0 or stop <= start:
        raise ValueError("Sampling period and bounds are invalid.")
    count = int(np.floor((stop - start) / period)) + 1
    if count > MAX_SAMPLES:
        raise ValueError("Sample count exceeds the limit.")
    x = start + np.arange(count) * period
    return discrete_signal(x, function(x))


def unit_step(value: Any) -> Any:
    if isinstance(value, sp.Basic):
        return sp.Heaviside(value)
    result = np.heaviside(np.asarray(value), 0.5)
    return result.item() if result.ndim == 0 else result


def unit_impulse(location: float = 0, magnitude: float = 1) -> dict[str, float]:
    if not np.isfinite([location, magnitude]).all():
        raise ValueError("Impulse values must be finite.")
    return {"kind": "impulse", "x": float(location), "magnitude": float(magnitude)}


def discrete_impulse(indices: Any, location: int = 0) -> Any:
    if isinstance(indices, sp.Basic):
        return sp.KroneckerDelta(indices, location)
    result = (np.asarray(indices) == location).astype(int)
    return result.item() if result.ndim == 0 else result


def piecewise(
    x: Any,
    pieces: Sequence[tuple[Callable[[Any], Any] | Any, Callable[[Any], Any]]],
    *,
    default: Any = 0,
) -> Any:
    array = np.asarray(x)
    result, unmatched = (
        np.full(array.shape, default, dtype=np.result_type(default, float)),
        np.ones(array.shape, dtype=bool),
    )
    for value, condition in pieces:
        mask = np.asarray(condition(array), dtype=bool) & unmatched
        result, unmatched = (
            np.where(mask, value(array) if callable(value) else value, result),
            unmatched & ~mask,
        )
    return result.item() if result.ndim == 0 else result


def convolve_discrete(first: Iterable[Any], second: Iterable[Any]) -> list[Any]:
    left, right = (
        _array(list(first), "First sequence"),
        _array(list(second), "Second sequence"),
    )
    if left.size + right.size - 1 > MAX_SAMPLES:
        raise ValueError("Convolution result exceeds the sample limit.")
    return np.convolve(left, right, mode="full").tolist()


def convolve_continuous(
    first: Iterable[Any], second: Iterable[Any], *, sample_period: float
) -> list[Any]:
    if not np.isfinite(sample_period) or sample_period <= 0:
        raise ValueError("Sample period must be positive and finite.")
    return (np.asarray(convolve_discrete(first, second)) * sample_period).tolist()


def laplace_transform(
    expression: sp.Expr, variable: sp.Symbol, s: sp.Symbol
) -> sp.Expr:
    return sp.laplace_transform(expression, variable, s, noconds=True)


def fourier_transform(
    expression: sp.Expr, variable: sp.Symbol, frequency: sp.Symbol
) -> sp.Expr:
    return sp.fourier_transform(expression, variable, frequency)


def z_transform(
    expression: sp.Expr, index: sp.Symbol, z: sp.Symbol, *, start: int = 0
) -> sp.Expr:
    return sp.summation(expression * z ** (-index), (index, start, sp.oo))
