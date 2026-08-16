from gestalt_signal_systems import continuous_signal, sample_signal


def generate(_context=None):
    signal = continuous_signal(lambda t: t, 0, 2, count=101)
    samples = sample_signal(lambda t: t, 0, 2, period=0.25)
    return {
        "secure_grading": True,
        "params": {"signal": signal, "samples": samples},
        "answer_specs": {
            "marker": {"type": "numeric", "absolute_tolerance": 0.025},
            "area": {
                "type": "calculus",
                "allowed_variables": [],
                "bound_variables": ["t"],
                "allowed_operators": ["Add", "Subtract", "Multiply", "Divide", "Power"],
                "calculus_operations": ["Integrate"],
            },
        },
        "correct_answers": {"marker": 1, "area": ["Integrate", "t", ["Tuple", "t", 0, 2]]},
    }
