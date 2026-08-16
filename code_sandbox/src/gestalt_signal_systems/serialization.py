"""Finite, size-bounded JSON conversion for frontend visual data."""

import math
from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np


class SerializationLimitError(ValueError):
    pass


def finite_json(value: Any, *, max_items: int = 20_000, max_depth: int = 24) -> Any:
    count = 0

    def convert(item: Any, depth: int) -> Any:
        nonlocal count
        count += 1
        if count > max_items or depth > max_depth:
            raise SerializationLimitError("Serialized output exceeds its size limit.")
        if item is None or isinstance(item, (str, bool, int)):
            return item
        if isinstance(item, (float, np.floating)):
            number = float(item)
            if not math.isfinite(number):
                raise SerializationLimitError("Serialized output must be finite.")
            return number
        if isinstance(item, (complex, np.complexfloating)):
            number = complex(item)
            if not (math.isfinite(number.real) and math.isfinite(number.imag)):
                raise SerializationLimitError("Serialized output must be finite.")
            return {"real": number.real, "imag": number.imag}
        if isinstance(item, (np.ndarray, np.generic)):
            return convert(item.tolist(), depth + 1)
        if isinstance(item, Mapping):
            if not all(isinstance(key, str) for key in item):
                raise TypeError("JSON object keys must be strings.")
            return {key: convert(child, depth + 1) for key, child in item.items()}
        if isinstance(item, Sequence) and not isinstance(item, (str, bytes, bytearray)):
            return [convert(child, depth + 1) for child in item]
        if hasattr(item, "tolist"):
            return convert(item.tolist(), depth + 1)
        raise TypeError(f"Unsupported JSON value: {type(item).__name__}")

    return convert(value, 0)
