import json
from collections.abc import Iterable
from datetime import date, datetime, time
from enum import Enum
from typing import Any
from uuid import UUID

# --- Third-Party ---
from pydantic import BaseModel


# --- Normalization Utilities ---
def normalize_values(vals: Iterable) -> list[Any]:
    """Normalize values by stripping whitespace from strings and removing Nones."""
    out = []
    for v in vals:
        if v is None:
            continue
        if isinstance(v, str):
            s = v.strip().lower()
            if not s:
                continue
            out.append(s)
        else:
            out.append(v)
    return out


def normalize_name(name: str) -> str:
    """Lowercase + trim; raises if empty after normalization."""
    if not name or not str(name).strip():
        raise ValueError("Name cannot be empty")
    return str(name).lower().strip()


def normalize_names(items: Iterable[str]) -> list[str]:
    """Normalize a list of names to lowercase and strip whitespace."""
    return [s.strip().lower() for s in items if isinstance(s, str) and s.strip()]


def normset(seq: Iterable[str]) -> set[str]:
    """Return a normalized set (lowercased and stripped) from a sequence of strings."""
    return {s.strip().lower() for s in seq}


def names(objs: Iterable[Any]) -> set[str]:
    """Return a set of `.name` attributes from an iterable of objects."""
    return {o.name for o in objs}


def to_serializable(obj: Any) -> Any:
    """
    Recursively convert Pydantic models (and nested dicts/lists thereof)
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
    if isinstance(obj, Enum):
        return obj.value

    return obj


def normalize_content(content: Any) -> str:
    """Ensure content is a string for reliable comparison."""
    if isinstance(content, str):
        return content
    if isinstance(content, bytes):
        return content.decode("utf-8")
    if isinstance(content, (bytearray, memoryview)):
        return bytes(content).decode("utf-8")
    if content is None:
        return ""
    try:
        return json.dumps(to_serializable(content), default=str, separators=(",", ":"))
    except (TypeError, ValueError):
        return str(content)


def normalize_newlines(b: bytes) -> bytes:
    return b.replace(b"\r\n", b"\n")
