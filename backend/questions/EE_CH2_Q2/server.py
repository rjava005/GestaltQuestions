import cmath
import math
import random
from typing import Any

VARIANTS = ("lowPass", "highPass")
RESISTANCES = (1000, 1500, 2200, 3300, 4700, 6800, 10000)
CAPACITANCES = (10e-9, 15e-9, 22e-9, 33e-9, 47e-9, 68e-9, 100e-9)
GAIN_RATIOS = (0.25, 0.33, 0.47, 0.68, 1.0)


def _round_significant(value: float, digits: int = 3) -> float:
    if not math.isfinite(value):
        raise ValueError("Computation produced a non-finite result.")
    if value == 0:
        return 0.0
    return round(value, digits - 1 - math.floor(math.log10(abs(value))))


def _normalize_phase(phase: float) -> float:
    normalized = (phase + 180.0) % 360.0 - 180.0
    return 0.0 if normalized == 0 else normalized


def _select_variant(previous: object, predefined: bool) -> str:
    available = [variant for variant in VARIANTS if variant != previous]
    if predefined:
        return available[0]
    return random.choice(available)


def generate(argument: bool | dict[str, Any] = False) -> dict[str, object]:
    """Generate a canonical equal-component second-order Sallen-Key response."""
    context = argument if isinstance(argument, dict) else {}
    predefined = (isinstance(argument, bool) and argument) or (
        context.get("usePredefinedValues") is True
    )
    previous = context.get("previousCircuitVariant")
    circuit_variant = _select_variant(previous, predefined)

    if predefined:
        capacitance = 100e-9
        resistance = 5000
        r3, r4 = 4000, 2000
        frequency_ratio = 2.0
    else:
        capacitance = random.choice(CAPACITANCES)
        resistance = random.choice(RESISTANCES)
        r3 = random.choice(RESISTANCES)
        r4 = r3 * random.choice(GAIN_RATIOS)
        frequency_ratio = math.exp(random.uniform(math.log(0.2), math.log(5.0)))

    gain_k = 1.0 + r4 / r3
    omega_0 = 1.0 / (resistance * capacitance)
    omega = omega_0 * frequency_ratio
    src = 1j * omega * resistance * capacitance
    denominator = src**2 + (3.0 - gain_k) * src + 1.0
    numerator = gain_k if circuit_variant == "lowPass" else gain_k * src**2
    response = numerator / denominator
    magnitude = abs(response)
    phase = _normalize_phase(math.degrees(cmath.phase(response)))

    if not all(
        math.isfinite(value)
        for value in (gain_k, omega_0, omega, magnitude, phase)
    ):
        raise ValueError("Computation produced a non-finite result.")

    if circuit_variant == "lowPass":
        filter_description = "low-pass"
        numerator_expression = "K"
        response_expression = "K/D"
    else:
        filter_description = "high-pass"
        numerator_expression = "K(sRC)^2"
        response_expression = "K(sRC)^2/D"

    return {
        "params": {
            "C1": capacitance,
            "C2": capacitance,
            "R1": resistance,
            "R2": resistance,
            "R3": r3,
            "R4": r4,
            "omega": omega,
            "omega0": omega_0,
            "frequencyRatio": frequency_ratio,
            "K": gain_k,
            "circuitVariant": circuit_variant,
            "filterDescription": filter_description,
            "numeratorExpression": numerator_expression,
            "responseExpression": response_expression,
            "unitsCapacitance": "F",
            "unitsResistance": "Ohm",
            "unitsAngularFrequency": "rad/s",
        },
        "correct_answers": {
            "gain": _round_significant(magnitude),
            "phaseShift": _round_significant(phase),
        },
        "nDigits": 3,
        "sigfigs": 3,
    }
