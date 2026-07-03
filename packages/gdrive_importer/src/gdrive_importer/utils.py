from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time
from pathlib import Path
from typing import Any
from uuid import UUID

from pydantic import BaseModel


def to_serializable(obj: Any) -> Any:
    """Recursively convert Pydantic models (and nested dicts/lists thereof)
    into plain Python data structures.
    """
    if isinstance(obj, BaseModel):
        return obj.model_dump()
    if isinstance(obj, dict):
        return {k: to_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_serializable(v) for v in obj]

    # --- Special cases ---
    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Path):
        return obj.as_posix()

    return obj


def collect_keys(
    obj: Any, path: str = "", keys: dict[str, set[str]] | None = None
) -> dict[str, set[str]]:
    if keys is None:
        keys = defaultdict(set)
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_path = f"{path}.{key}" if path else key
            keys[key].add(full_path)
            collect_keys(value, full_path, keys)
    elif isinstance(obj, list):
        for item in obj:
            collect_keys(item, path, keys)
    return keys
