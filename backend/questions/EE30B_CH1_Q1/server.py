import random
import math

def generate(use_predefined_values=0):
    if use_predefined_values == 0:
        # Generate random values within realistic ranges
        vs_amplitude = random.uniform(30, 100)  # Voltage source amplitude in Volts
        vs_frequency = random.uniform(100, 500)  # Frequency in rad/s
        resistance = random.uniform(5, 20)  # Resistance in ohms
        capacitance = random.uniform(1, 50) * 1e-3  # Capacitance in mF, convert to F
        inductance = random.uniform(5, 50) * 1e-3  # Inductance in mH, convert to H
    else:
        # Use a small set of predefined values
        predefined_values = [
            {'vs_amplitude': 50, 'vs_frequency': 200, 'resistance': 10, 'capacitance': 5e-3, 'inductance': 20e-3},
            {'vs_amplitude': 75, 'vs_frequency': 300, 'resistance': 15, 'capacitance': 10e-3, 'inductance': 30e-3},
            {'vs_amplitude': 40, 'vs_frequency': 150, 'resistance': 10, 'capacitance': 2e-3, 'inductance': 10e-3},
        ]
        choice = random.choice(predefined_values)
        vs_amplitude = choice['vs_amplitude']
        vs_frequency = choice['vs_frequency']
        resistance = choice['resistance']
        capacitance = choice['capacitance']
        inductance = choice['inductance']

    # Angular frequency
    omega = vs_frequency
    
    # Impedance calculations
    Z_R = resistance  # Ohms
    Z_L = complex(0, omega * inductance)  # jωL
    Z_C = complex(0, -1 / (omega * capacitance))  # -j/(ωC)
    
    # Total impedance Z
    Z = Z_R + Z_L + Z_C
    Z_magnitude = abs(Z)
    Z_phase_angle = math.degrees(math.atan2(Z.imag, Z.real))
    
    # Phasor domain calculations
    V_s = complex(vs_amplitude, 0)  # V_s in angle 0
    I = V_s / Z  # Current phasor
    I_magnitude = abs(I)
    I_phase = math.degrees(math.atan2(I.imag, I.real))

    # Prepare the return object
    params = {
        "vs_amplitude": vs_amplitude,
        "vs_frequency": vs_frequency,
        "resistance": resistance,
        "capacitance": capacitance * 1e3,  # Convert back to mF for display
        "inductance": inductance * 1e3,  # Convert back to mH for display
    }
    correct_answers = {
        "current_amplitude": round(I_magnitude, 3),
        "current_phase": round(I_phase, 3),
    }

    return {
        "params": params,
        "correct_answers": correct_answers,
        "nDigits": 3,
        "sigfigs": 3,
    }
