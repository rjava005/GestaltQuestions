from typing import Dict


def add_numbers(a: int, b: int) -> int:
    return a + b


def build_message(a: int, b: int, total: int) -> str:
    return f"{a} + {b} = {total}"


def summary(a: int, b: int, total: int) -> Dict[str, int]:
    return {"a": a, "b": b, "sum": total}
