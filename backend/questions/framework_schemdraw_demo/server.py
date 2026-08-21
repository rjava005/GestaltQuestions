"""Adaptive runtime for the SchemDraw-generated feedback loop.

The geometry in block-diagram.json was produced offline by
tools/schemdraw_bridge; this runtime only supplies the values the diagram's
parameter bindings resolve against, plus the grading contract. Regenerating the
layout and changing the numbers are independent operations.
"""

import random

from gestalt_signal_systems import feedback, series, transfer_function


def generate(_context=None):
    gain = random.choice([2, 3, 4, 5])
    pole = random.choice([1, 2, 4])

    # Reduce the loop with the shared control helpers rather than trusting the
    # closed form, so the drawn system and the graded answer cannot drift.
    loop = feedback(series(transfer_function([gain], [1]),
                           transfer_function([1], [1, pole])))
    denominator = list(loop.den[0][0])
    constant_term = round(float(denominator[-1]))

    return {
        "secure_grading": True,
        # These paths are exactly what the generated block-diagram.json binds to.
        "params": {
            "controller": gain,
            "plant": f"1/(s+{pole})",
        },
        "answer_specs": {
            "closed_loop": {
                "type": "transfer_function",
                "allowed_variables": ["s"],
                "allowed_operators": [
                    "Add",
                    "Subtract",
                    "Negate",
                    "Multiply",
                    "Divide",
                    "Power",
                ],
            },
        },
        "correct_answers": {
            "closed_loop": ["Divide", gain, ["Add", "s", constant_term]],
        },
    }
