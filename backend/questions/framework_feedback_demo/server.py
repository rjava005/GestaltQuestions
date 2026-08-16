import random

from gestalt_signal_systems import feedback, series, transfer_function


def generate(_context=None):
    gain = random.choice([2, 3, 4, 5])
    plant = transfer_function([1], [1, 2])
    feedback(series(transfer_function([gain], [1]), plant))
    return {
        "secure_grading": True,
        "params": {"gain": gain},
        "answer_specs": {
            "dc_gain": {"type": "numeric", "relative_tolerance": 0.001},
            "closed_loop": {
                "type": "transfer_function",
                "allowed_variables": ["s"],
                "allowed_operators": ["Add", "Subtract", "Negate", "Multiply", "Divide", "Power"],
            },
        },
        "correct_answers": {
            "dc_gain": gain / (gain + 2),
            "closed_loop": ["Divide", gain, ["Add", "s", gain + 2]],
        },
    }
