# --- Standard Library ---
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