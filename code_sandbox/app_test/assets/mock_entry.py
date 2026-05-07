from typing import Dict, Any


def generate() -> Dict[str, Any]:
    a = 2
    b = 3
    total = a + b

    print("mock py no import")

    return {
        "source": "mock_entry.py",
        "values": {"a": a, "b": b},
        "total": total,
    }
