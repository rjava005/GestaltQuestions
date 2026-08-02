const math = require("mathjs");

const generate = (usePredefinedValues = false) => {
    // 1. Dynamic Parameter Selection

    // 2. Value Generation
    let vsAmplitude, vsFrequency, resistance, capacitance, inductance;
    if (!usePredefinedValues) {
        // Generate random values
        vsAmplitude = math.round(math.random(10, 100), 1); // volts
        vsFrequency = math.round(math.random(50, 500), 0); // rad/s
        resistance = math.round(math.random(5, 30), 1); // ohms
        capacitance = math.round(math.random(1, 10), 3); // mF
        inductance = math.round(math.random(5, 50), 1); // mH
    } else {
        // Predefined test values
        vsAmplitude = 50; // volts
        vsFrequency = 200; // rad/s
        resistance = 10; // ohms
        capacitance = 5; // mF
        inductance = 20; // mH
    }

    // 3. Computation Logic
    capacitance *= 1e-3; // convert mF to F
    inductance *= 1e-3; // convert mH to H

    const omega = vsFrequency; // Angular frequency in rad/s

    const ZR = resistance;

    try {
        if (capacitance === 0 || inductance === 0) {
            throw new Error("Capacitance or inductance should not be zero.");
        }

        const ZC = math.complex(0, -1 / (omega * capacitance));
        const ZL = math.complex(0, omega * inductance);

        const ZTotal = math.add(ZR, ZL, ZC);
        const ZMagnitude = math.abs(ZTotal);
        const ZPhase = math.arg(ZTotal) * (180 / Math.PI); // Convert radians to degrees

        const currentPhasor = math.divide(math.complex(vsAmplitude, 0), ZTotal);
        const currentAmplitude = math.abs(currentPhasor);
        const currentPhase = math.arg(currentPhasor) * (180 / Math.PI); // Convert radians to degrees

        return {
            params: {
                vs_amplitude: vsAmplitude,
                vs_frequency: vsFrequency,
                resistance,
                capacitance: capacitance * 1e3, // return capacitance as mF
                inductance: inductance * 1e3 // return inductance as mH
            },
            correct_answers: {
                current_amplitude: math.round(currentAmplitude, 3),
                current_phase: math.round(currentPhase, 3),
            },
            intermediate: {
                Z_magnitude: math.round(ZMagnitude, 3),
                Z_phase: math.round(ZPhase, 3),
                omega: math.round(omega, 3)
            },
            nDigits: 3,
            sigfigs: 3
        };
    } catch (error) {
        console.error("Error in calculating impedance or current phasor:", error.message);
        return null;
    }
};

module.exports = { generate };
