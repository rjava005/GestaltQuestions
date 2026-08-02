const math = require("mathjs");

const generate = (usePredefinedValues = false) => {
    // 1. Dynamic Parameter Selection

    // 2. Value Generation
    let resistance, inductance;
    if (!usePredefinedValues) {
        // Generate random values
        resistance = math.round(math.random(1, 10), 1); // ohms
        inductance = math.round(math.random(0.05, 0.5), 2); // H
    } else {
        // Predefined test values
        resistance = 1; // ohms
        inductance = 0.25; // H
    }

    if (inductance <= 0) {
        throw new Error("Inductance must be positive.");
    }

    // At the -3 dB point of a series RL high-pass circuit, omega * L = R.
    const angularFrequency = resistance / inductance;
    const frequency = angularFrequency / (2 * Math.PI);

    return {
        params: { resistance, inductance },
        correct_answers: { frequency: math.round(frequency, 3) },
        intermediate: { angular_frequency: math.round(angularFrequency, 3) },
        nDigits: 3,
        sigfigs: 3
    };
};

module.exports = { generate };
