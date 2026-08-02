import math
import random


def generate(use_predefined_values: bool = False) -> dict[str, object]:
    if use_predefined_values:
        resistance, inductance = 1.0, 0.25
    else:
        resistance = round(random.uniform(1, 10), 1)
        inductance = round(random.uniform(0.05, 0.5), 2)

    if inductance <= 0:
        raise ValueError("Inductance must be positive.")

    angular_frequency = resistance / inductance
    frequency = angular_frequency / (2 * math.pi)

    return {
        "params": {"resistance": resistance, "inductance": inductance},
        "correct_answers": {"frequency": round(frequency, 3)},
        "intermediate": {"angular_frequency": round(angular_frequency, 3)},
        "nDigits": 3,
        "sigfigs": 3,
    }
