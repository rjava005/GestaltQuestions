import cmath
import math
import random


def generate(use_predefined_values: bool = False) -> dict[str, object]:
    if use_predefined_values:
        params = {
            "V_source": 150,
            "angle": 20,
            "R1": 2,
            "R2": 1,
            "R3": 3,
            "L": 4,
            "C": 2,
        }
    else:
        params = {
            "V_source": random.randint(100, 200),
            "angle": random.randint(0, 360),
            "R1": random.randint(1, 10),
            "R2": random.randint(1, 10),
            "R3": random.randint(1, 10),
            "L": random.randint(1, 10),
            "C": random.randint(1, 10),
        }

    source = cmath.rect(params["V_source"], math.radians(params["angle"]))
    z_l = 1j * params["L"]
    z_c = -1j * params["C"]
    r1, r2, r3 = params["R1"], params["R2"], params["R3"]

    a = 1 / r1 + 1 / z_l + 1 / r2 + 1 / r3
    b = -1 / r3
    c = b
    d = 1 / r3 + 1 / z_c
    source_current = source / r1
    determinant = a * d - b * c

    if abs(determinant) < 1e-12:
        raise ValueError("The generated nodal system is singular.")

    v1 = source_current * d / determinant
    v2 = -c * source_current / determinant
    io = (v1 - v2) / r3

    return {
        "params": params,
        "correct_answers": {"Io": round(abs(io), 3)},
        "intermediate": {
            "Io_real": round(io.real, 3),
            "Io_imaginary": round(io.imag, 3),
        },
        "nDigits": 3,
        "sigfigs": 3,
    }
