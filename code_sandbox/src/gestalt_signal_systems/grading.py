"""Restricted MathJSON validation, translation, and equivalence grading."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any, Literal

import sympy as sp

GradeStatus = Literal["correct", "incorrect", "invalid"]
_NUMBER = re.compile(r"^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$")
_INTEGER = re.compile(r"^[+-]?\d+$")

_CONSTANTS = {
    "Pi": sp.pi,
    "pi": sp.pi,
    "ExponentialE": sp.E,
    "e": sp.E,
    "ImaginaryUnit": sp.I,
    "i": sp.I,
    "j": sp.I,
    "PositiveInfinity": sp.oo,
    "Infinity": sp.oo,
    "NegativeInfinity": -sp.oo,
}
_FUNCTIONS = {
    "Sin": sp.sin,
    "Cos": sp.cos,
    "Tan": sp.tan,
    "Cot": sp.cot,
    "Sec": sp.sec,
    "Csc": sp.csc,
    "Sinh": sp.sinh,
    "Cosh": sp.cosh,
    "Tanh": sp.tanh,
    "Exp": sp.exp,
    "Ln": sp.log,
    "Log": sp.log,
    "Abs": sp.Abs,
    "Sign": sp.sign,
    "Heaviside": sp.Heaviside,
}
_ARITHMETIC = {
    "Add",
    "Subtract",
    "Negate",
    "Multiply",
    "Divide",
    "Power",
    "Root",
    "Sqrt",
    "Abs",
}
_CALCULUS = {"Derivative", "PartialDerivative", "Integrate", "Sum", "Limit"}
_STRUCTURAL = {"Tuple", "Triple", "Pair", "Limits", "List"}


class MathJsonError(ValueError):
    """The submitted expression violates its answer-slot contract."""


@dataclass(frozen=True)
class ExpressionLimits:
    max_depth: int = 32
    max_nodes: int = 512


def _operator_name(node: list[Any]) -> str:
    if not node or not isinstance(node[0], str):
        raise MathJsonError("MathJSON function arrays need a string operator.")
    return node[0]


def _payload(answer: Any) -> Any:
    if isinstance(answer, dict) and "mathjson" in answer:
        return answer["mathjson"]
    if isinstance(answer, dict) and "mathJson" in answer:
        return answer["mathJson"]
    return answer


def _allowed(spec: dict[str, Any]) -> tuple[set[str], set[str], set[str], set[str]]:
    kind = str(spec.get("type", "symbolic"))
    variables = {
        str(item) for item in spec.get("allowed_variables", spec.get("variables", []))
    }
    bound = {str(item) for item in spec.get("bound_variables", [])}
    functions = {
        str(item) for item in spec.get("allowed_functions", spec.get("functions", []))
    }
    explicit = spec.get("allowed_operators", spec.get("operators"))
    operators = (
        {str(item) for item in explicit} if explicit is not None else set(_ARITHMETIC)
    )
    if kind == "calculus":
        permitted = spec.get(
            "calculus_operations", spec.get("permitted_operations", _CALCULUS)
        )
        operators |= {str(item) for item in permitted}
    return variables, bound, functions, operators


def validate_mathjson(
    node: Any, spec: dict[str, Any], *, limits: ExpressionLimits | None = None
) -> None:
    """Validate every node before any SymPy objects are constructed."""
    limits = limits or ExpressionLimits(
        max_depth=int(spec.get("max_depth", 32)),
        max_nodes=int(spec.get("max_nodes", 512)),
    )
    variables, bound, functions, operators = _allowed(spec)
    seen = 0

    def visit(item: Any, depth: int, local_bound: set[str]) -> None:
        nonlocal seen
        seen += 1
        if depth > limits.max_depth or seen > limits.max_nodes:
            raise MathJsonError(
                "Expression exceeds the answer slot's complexity limit."
            )
        if isinstance(item, bool) or item is None:
            raise MathJsonError("Boolean and null MathJSON nodes are not permitted.")
        if isinstance(item, (int, float)):
            if isinstance(item, float) and not math.isfinite(item):
                raise MathJsonError("Numbers must be finite.")
            return
        if isinstance(item, str):
            if item not in variables | local_bound | set(_CONSTANTS):
                raise MathJsonError(f"Variable or constant '{item}' is not permitted.")
            return
        if isinstance(item, dict):
            if set(item) == {"num"}:
                _parse_number(item["num"])
                return
            if set(item) == {"sym"} and isinstance(item["sym"], str):
                visit(item["sym"], depth + 1, local_bound)
                return
            if set(item) == {"fn"} and isinstance(item["fn"], list):
                visit(item["fn"], depth + 1, local_bound)
                return
            raise MathJsonError("Unsupported MathJSON object node.")
        if not isinstance(item, list):
            raise MathJsonError("Unsupported MathJSON node type.")
        op = _operator_name(item)
        if op in _STRUCTURAL:
            for child in item[1:]:
                visit(child, depth + 1, local_bound)
            return
        if op in _FUNCTIONS or op in functions:
            if op not in functions and op not in operators:
                raise MathJsonError(f"Function '{op}' is not permitted.")
        elif op not in operators:
            raise MathJsonError(f"Operator '{op}' is not permitted.")
        next_bound = set(local_bound)
        if op in _CALCULUS:
            variable = _calculus_variable(item)
            if variable is not None:
                if variable not in bound | variables:
                    raise MathJsonError(
                        f"Bound variable '{variable}' is not permitted."
                    )
                next_bound.add(variable)
        for index, child in enumerate(item[1:]):
            if (
                op == "Limit"
                and index == 3
                and isinstance(child, str)
                and child.lower()
                in {"above", "below", "left", "right", "both", "+", "-", "+-"}
            ):
                continue
            visit(child, depth + 1, next_bound)

    visit(_payload(node), 0, set())


def _parse_number(value: Any) -> sp.Expr:
    if isinstance(value, bool):
        raise MathJsonError("Boolean is not a number.")
    if isinstance(value, int):
        return sp.Integer(value)
    if isinstance(value, float):
        if not math.isfinite(value):
            raise MathJsonError("Numbers must be finite.")
        return sp.Rational(str(value))
    if not isinstance(value, str):
        raise MathJsonError("Invalid numeric node.")
    value = value.strip()
    if len(value) > 128:
        raise MathJsonError("Numeric literal exceeds the length limit.")
    if "/" in value:
        parts = value.split("/")
        if len(parts) != 2 or not all(
            _INTEGER.fullmatch(part.strip()) for part in parts
        ):
            raise MathJsonError("Invalid rational number.")
        if int(parts[1]) == 0:
            raise MathJsonError("Division by zero.")
        return sp.Rational(int(parts[0]), int(parts[1]))
    if not _NUMBER.fullmatch(value):
        raise MathJsonError("Invalid numeric literal.")
    return sp.Rational(value)


def _symbol_name(node: Any) -> str | None:
    if isinstance(node, str):
        return node
    if isinstance(node, dict) and set(node) == {"sym"} and isinstance(node["sym"], str):
        return node["sym"]
    return None


def _calculus_variable(node: list[Any]) -> str | None:
    for child in node[2:]:
        name = _symbol_name(child)
        if name:
            return name
        if (
            isinstance(child, list)
            and child
            and child[0] in _STRUCTURAL
            and len(child) > 1
        ):
            name = _symbol_name(child[1])
            if name:
                return name
    return None


def _range(args: list[Any]) -> tuple[Any, Any, Any]:
    if args and isinstance(args[0], list) and args[0] and args[0][0] in _STRUCTURAL:
        values = args[0][1:]
        if len(values) >= 3:
            return values[0], values[1], values[2]
    if len(args) >= 3:
        return args[0], args[1], args[2]
    raise MathJsonError(
        "A bound operator requires a variable, lower bound, and upper bound."
    )


def mathjson_to_sympy(node: Any, spec: dict[str, Any]) -> sp.Expr:
    """Translate already validated MathJSON with no string expression parser."""
    node = _payload(node)
    validate_mathjson(node, spec)
    variables, bound, _, _ = _allowed(spec)
    symbols = {name: sp.Symbol(name) for name in variables | bound}

    def build(item: Any) -> sp.Expr:
        if isinstance(item, (int, float)):
            return _parse_number(item)
        if isinstance(item, str):
            return _CONSTANTS[item] if item in _CONSTANTS else symbols[item]
        if isinstance(item, dict):
            if "num" in item:
                return _parse_number(item["num"])
            if "sym" in item:
                return build(item["sym"])
            return build(item["fn"])
        op, args = _operator_name(item), item[1:]
        if op == "Add":
            return sp.Add(*(build(arg) for arg in args))
        if op == "Subtract" and len(args) == 2:
            return build(args[0]) - build(args[1])
        if op == "Negate" and len(args) == 1:
            return -build(args[0])
        if op == "Multiply":
            return sp.Mul(*(build(arg) for arg in args))
        if op == "Divide" and len(args) == 2:
            return build(args[0]) / build(args[1])
        if op == "Power" and len(args) == 2:
            return build(args[0]) ** build(args[1])
        if op == "Sqrt" and len(args) == 1:
            return sp.sqrt(build(args[0]))
        if op == "Root" and len(args) == 2:
            return build(args[0]) ** (1 / build(args[1]))
        if op in _FUNCTIONS:
            return _FUNCTIONS[op](*(build(arg) for arg in args))
        if op in spec.get("allowed_functions", spec.get("functions", [])):
            return sp.Function(op)(*(build(arg) for arg in args))
        if op in {"D", "Derivative", "PartialDerivative"}:
            if len(args) < 2:
                raise MathJsonError("Derivative requires an expression and variable.")
            variable = args[1]
            order: Any = 1
            if isinstance(variable, list) and variable and variable[0] in _STRUCTURAL:
                values = variable[1:]
                variable, order = values[0], values[1] if len(values) > 1 else 1
            return sp.diff(
                build(args[0]), symbols[_symbol_name(variable) or ""], int(build(order))
            )
        if op in {"Integrate", "Sum"}:
            variable, lower, upper = _range(args[1:])
            limits = (symbols[_symbol_name(variable) or ""], build(lower), build(upper))
            return (
                sp.integrate(build(args[0]), limits)
                if op == "Integrate"
                else sp.summation(build(args[0]), limits)
            )
        if op == "Limit":
            if len(args) < 3:
                raise MathJsonError(
                    "Limit requires an expression, variable, and point."
                )
            direction = "+-" if len(args) < 4 else str(args[3]).lower()
            direction = {
                "above": "+",
                "right": "+",
                "below": "-",
                "left": "-",
                "both": "+-",
            }.get(direction, direction)
            return sp.limit(
                build(args[0]),
                symbols[_symbol_name(args[1]) or ""],
                build(args[2]),
                dir=direction,
            )
        raise MathJsonError(f"Unsupported operator '{op}'.")

    return build(node)


def _numeric(answer: Any) -> Decimal:
    if isinstance(answer, dict):
        answer = answer.get("value", answer.get("mathjson"))
    if isinstance(answer, bool) or not isinstance(answer, (str, int, float, Decimal)):
        raise MathJsonError("Numeric answer must contain a number.")
    raw = str(answer).strip()
    if len(raw) > 128:
        raise MathJsonError("Numeric answer exceeds the length limit.")
    try:
        value = Decimal(raw)
    except (InvalidOperation, ValueError) as exc:
        raise MathJsonError("Invalid numeric answer.") from exc
    if not value.is_finite():
        raise MathJsonError("Numeric answer must be finite.")
    return value


def _equivalent(student: sp.Expr, correct: sp.Expr) -> bool:
    try:
        difference = sp.cancel(sp.together(student - correct))
        if difference == 0 or sp.simplify(difference) == 0:
            return True
    except Exception:  # noqa: BLE001 - SymPy raises several internal types.
        difference = None
    symbols = sorted(student.free_symbols | correct.free_symbols, key=str)
    samples = (
        sp.Rational(2, 3),
        sp.Rational(5, 4),
        sp.Rational(7, 3),
        -sp.Rational(4, 3),
    )
    successes = 0
    for offset in range(4):
        substitutions = {
            symbol: samples[(index + offset) % len(samples)]
            for index, symbol in enumerate(symbols)
        }
        try:
            value = complex(sp.N((student - correct).subs(substitutions), 30))
            if not math.isfinite(value.real) or not math.isfinite(value.imag):
                continue
            successes += 1
            if abs(value) > 1e-10:
                return False
        except Exception:  # noqa: BLE001 - singular sample points are skipped.
            value = None
        if value is None:
            continue
    return successes >= min(2, max(1, len(symbols)))


def grade_answer(answer: Any, correct: Any, spec: dict[str, Any]) -> dict[str, Any]:
    """Grade one slot without parsing submitted LaTeX or Python expressions."""
    try:
        kind = str(spec.get("type", "symbolic"))
        if kind == "numeric":
            student, expected = _numeric(answer), _numeric(correct)
            units = spec.get("units")
            submitted_units = answer.get("units") if isinstance(answer, dict) else None
            if units:
                units_match = (
                    submitted_units in units
                    if isinstance(units, list)
                    else submitted_units == units
                )
                if not units_match:
                    return {"status": "incorrect"}
            absolute = Decimal(str(spec.get("absolute_tolerance", spec.get("atol", 0))))
            relative = Decimal(str(spec.get("relative_tolerance", spec.get("rtol", 0))))
            matched = abs(student - expected) <= max(absolute, relative * abs(expected))
        else:
            matched = _equivalent(
                mathjson_to_sympy(answer, spec), mathjson_to_sympy(correct, spec)
            )
        return {"status": "correct" if matched else "incorrect"}
    except (MathJsonError, ArithmeticError, TypeError, ValueError, KeyError) as exc:
        return {"status": "invalid", "message": str(exc)}


def grade_answers(
    answers: dict[str, Any], private_data: dict[str, Any]
) -> dict[str, Any]:
    specs, correct = (
        private_data.get("answer_specs", {}),
        private_data.get("correct_answers", {}),
    )
    results = {
        name: grade_answer(answers.get(name), correct.get(name), spec)
        for name, spec in specs.items()
    }
    statuses = {item["status"] for item in results.values()}
    overall = (
        "invalid"
        if "invalid" in statuses
        else "correct"
        if results and statuses == {"correct"}
        else "incorrect"
    )
    return {"overall": overall, "slots": results}
