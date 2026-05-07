from typing import Dict, Any
from utils import add_numbers, build_message, summary


def generate() -> Dict[str, Any]:
    a = 4
    b = 5
    total = add_numbers(a, b)

    print("mock py with utils")

    return {
        "source": "mock_entry_with_utils.py",
        "values": summary(a, b, total),
        "total": total,
        "message": build_message(a, b, total),
    }
