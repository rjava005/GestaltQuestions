"""Adaptive runtime for the SchemDraw-generated RC low-pass circuit.

circuit.json was produced offline by tools/schemdraw_bridge, from this
bundle's own generate_diagram.py; this runtime only supplies the values its
parameter bindings resolve against. Regenerating the layout and changing the
component values are independent operations.

R and C are emitted in base units (ohms, farads), matching circuit.json's
sourceUnit bindings ("ohm" / "F") -- the renderer applies engineering-prefix
formatting for display (e.g. 4700 ohms shows as "4.7 kOhm").
"""

import math
import random


def generate(_context=None):
    resistance = random.choice([1000, 2200, 4700, 10000])  # ohms
    capacitance = random.choice([10e-9, 22e-9, 47e-9, 100e-9])  # farads
    cutoff_hz = 1 / (2 * math.pi * resistance * capacitance)

    return {
        "secure_grading": True,
        "params": {"R": resistance, "C": capacitance},
        "answer_specs": {
            "cutoff_hz": {"type": "numeric", "relative_tolerance": 0.01},
        },
        "correct_answers": {"cutoff_hz": cutoff_hz},
    }
