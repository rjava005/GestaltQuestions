# --- Standard Library ---
import re
from pathlib import Path
from typing import Any


def pick(obj: Any, *keys: str, default: Any = None) -> Any:
    """
    Get the first present key/attr from `keys` on either a dict or an object.
    Returns the value if found, otherwise `default`.
    """
    for k in keys:
        if isinstance(obj, dict):
            if k in obj:
                return obj[k]
        else:
            if hasattr(obj, k):
                return getattr(obj, k)
    return default


def validate_response_payload(payload: dict, created: dict, key: str) -> bool:
    """Compare a given key in the request payload and response payload."""
    return pick(payload, key) == pick(created, key)


_filename_safe_re = re.compile(r"[^A-Za-z0-9._-]+")


def safe_dir_name(name: str | Path, max_length: int = 100) -> str:
    """Return a sanitized, filesystem-safe directory name from the input."""
    if isinstance(name, Path):
        name = name.as_posix()
    if name.endswith("-/") or name.endswith("-\\"):
        name = f"{name[:-2]}_"
    name = Path(name).name
    name = name.strip().replace(" ", "_")
    name = name.replace("-", "_")
    name = name = _filename_safe_re.sub("_", name)
    if not name or name.startswith("."):
        raise ValueError("Could not generate safe name")
    if len(name) > max_length:
        name = name[:max_length]
    return name
