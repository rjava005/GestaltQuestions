const VARIANTS = ["lowPass", "highPass"];
const RESISTANCES = [1000, 1500, 2200, 3300, 4700, 6800, 10000];
const CAPACITANCES = [10e-9, 15e-9, 22e-9, 33e-9, 47e-9, 68e-9, 100e-9];
const GAIN_RATIOS = [0.25, 0.33, 0.47, 0.68, 1.0];

function choose(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function roundSignificant(value, digits = 3) {
  if (!Number.isFinite(value)) {
    throw new Error("Computation produced a non-finite result.");
  }
  return value === 0 ? 0 : Number(value.toPrecision(digits));
}

function normalizePhase(phase) {
  const normalized = ((phase + 180) % 360 + 360) % 360 - 180;
  return Object.is(normalized, -0) ? 0 : normalized;
}

function generate(argument = false) {
  const context = argument && typeof argument === "object" ? argument : {};
  const predefined =
    (typeof argument === "boolean" && argument) ||
    context.usePredefinedValues === true;
  const available = VARIANTS.filter(
    (variant) => variant !== context.previousCircuitVariant,
  );
  const circuitVariant = predefined ? available[0] : choose(available);

  let capacitance;
  let resistance;
  let r3;
  let r4;
  let frequencyRatio;
  if (predefined) {
    capacitance = 100e-9;
    resistance = 5000;
    r3 = 4000;
    r4 = 2000;
    frequencyRatio = 2.0;
  } else {
    capacitance = choose(CAPACITANCES);
    resistance = choose(RESISTANCES);
    r3 = choose(RESISTANCES);
    r4 = r3 * choose(GAIN_RATIOS);
    frequencyRatio = Math.exp(
      Math.log(0.2) + Math.random() * (Math.log(5.0) - Math.log(0.2)),
    );
  }

  const K = 1 + r4 / r3;
  const omega0 = 1 / (resistance * capacitance);
  const omega = omega0 * frequencyRatio;
  const x = omega * resistance * capacitance;
  const denominatorReal = 1 - x * x;
  const denominatorImaginary = (3 - K) * x;
  const numeratorReal = circuitVariant === "lowPass" ? K : -K * x * x;
  const denominatorMagnitudeSquared =
    denominatorReal * denominatorReal +
    denominatorImaginary * denominatorImaginary;
  const responseReal =
    (numeratorReal * denominatorReal) / denominatorMagnitudeSquared;
  const responseImaginary =
    (-numeratorReal * denominatorImaginary) / denominatorMagnitudeSquared;
  const magnitude = Math.hypot(responseReal, responseImaginary);
  const phase = normalizePhase(
    Math.atan2(responseImaginary, responseReal) * (180 / Math.PI),
  );

  if (![K, omega0, omega, magnitude, phase].every(Number.isFinite)) {
    throw new Error("Computation produced a non-finite result.");
  }

  const lowPass = circuitVariant === "lowPass";
  return {
    params: {
      C1: capacitance,
      C2: capacitance,
      R1: resistance,
      R2: resistance,
      R3: r3,
      R4: r4,
      omega,
      omega0,
      frequencyRatio,
      K,
      circuitVariant,
      filterDescription: lowPass ? "low-pass" : "high-pass",
      numeratorExpression: lowPass ? "K" : "K(sRC)^2",
      responseExpression: lowPass ? "K/D" : "K(sRC)^2/D",
      unitsCapacitance: "F",
      unitsResistance: "Ohm",
      unitsAngularFrequency: "rad/s",
    },
    correct_answers: {
      gain: roundSignificant(magnitude),
      phaseShift: roundSignificant(phase),
    },
    nDigits: 3,
    sigfigs: 3,
  };
}

module.exports = { generate };
