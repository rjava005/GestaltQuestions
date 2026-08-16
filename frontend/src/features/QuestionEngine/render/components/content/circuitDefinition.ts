export type CircuitPoint = [number, number];

export const CIRCUIT_GRID_SIZE = 20;

export type CircuitValueBinding = {
  path: string;
  sourceUnit?: string;
  unit?: string;
  prefix?: string;
  suffix?: string;
  significantDigits?: number;
  engineering?: boolean;
};

export type CircuitValue =
  | CircuitValueBinding
  | {
      template: string;
      bindings: Record<string, CircuitValueBinding>;
    };

export type CircuitLabel = {
  at: CircuitPoint;
  anchor?: "start" | "middle" | "end";
};

type TwoTerminalElement = {
  id: string;
  from: CircuitPoint;
  to: CircuitPoint;
  label?: string;
  labelPosition?: CircuitLabel;
  value?: CircuitValue;
};

export type CircuitElement =
  | (TwoTerminalElement & {
      type: "resistor" | "capacitor" | "inductor" | "voltageSource";
    })
  | {
      id: string;
      type: "opAmp";
      center: CircuitPoint;
      width: number;
      height: number;
      direction?: "right" | "left";
      label?: string;
      labelPosition?: CircuitLabel;
      value?: CircuitValue;
    }
  | {
      id: string;
      type: "ground" | "terminal";
      at: CircuitPoint;
      direction?: "down" | "up";
      label?: string;
      labelPosition?: CircuitLabel;
      value?: CircuitValue;
    };

type OpAmpElement = Extract<CircuitElement, { type: "opAmp" }>;

export type CircuitTerminalStub = {
  terminal: CircuitPoint;
  symbol: CircuitPoint;
};

export function getOpAmpTerminalStubs(
  element: OpAmpElement,
): [CircuitTerminalStub, CircuitTerminalStub, CircuitTerminalStub] {
  const [cx, cy] = element.center;
  const halfWidth = element.width / 2;
  const halfHeight = element.height / 2;
  const right = element.direction !== "left";
  const baseX = right ? cx - halfWidth : cx + halfWidth;
  const tipX = right ? cx + halfWidth : cx - halfWidth;
  const inputTerminalX =
    baseX + (right ? -CIRCUIT_GRID_SIZE : CIRCUIT_GRID_SIZE);
  const outputTerminalX =
    tipX + (right ? CIRCUIT_GRID_SIZE : -CIRCUIT_GRID_SIZE);
  return [
    {
      terminal: [inputTerminalX, cy - halfHeight / 2],
      symbol: [baseX, cy - halfHeight / 2],
    },
    {
      terminal: [inputTerminalX, cy + halfHeight / 2],
      symbol: [baseX, cy + halfHeight / 2],
    },
    { terminal: [outputTerminalX, cy], symbol: [tipX, cy] },
  ];
}

export type CircuitAnnotation =
  | {
      type: "currentArrow";
      from: CircuitPoint;
      to: CircuitPoint;
      label?: string;
      labelPosition?: CircuitLabel;
    }
  | {
      type: "polarity";
      plus: CircuitPoint;
      minus: CircuitPoint;
      label?: string;
      labelPosition?: CircuitLabel;
    }
  | {
      type: "text";
      at: CircuitPoint;
      text: string;
      anchor?: "start" | "middle" | "end";
      value?: CircuitValue;
    }
  | {
      type: "node";
      at: CircuitPoint;
    };

export type CircuitScene = {
  viewBox: [number, number, number, number];
  ariaLabel: string;
  wires: Array<{
    points: CircuitPoint[];
  }>;
  elements: CircuitElement[];
  annotations?: CircuitAnnotation[];
};

export type CircuitDefinitionV1 = CircuitScene & {
  version: 1;
};

export type CircuitDefinitionV2 = {
  version: 2;
  selector: {
    path: string;
  };
  variants: Record<string, CircuitScene>;
};

export type CircuitDefinition = CircuitDefinitionV1 | CircuitDefinitionV2;

const elementTypes = new Set([
  "resistor",
  "capacitor",
  "inductor",
  "voltageSource",
  "opAmp",
  "ground",
  "terminal",
]);
const annotationTypes = new Set(["currentArrow", "polarity", "text", "node"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPoint(value: unknown): value is CircuitPoint {
  return (
    Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber)
  );
}

function isLabel(value: unknown): boolean {
  return (
    value === undefined ||
    (isRecord(value) &&
      isPoint(value.at) &&
      (value.anchor === undefined ||
        value.anchor === "start" ||
        value.anchor === "middle" ||
        value.anchor === "end"))
  );
}

function isBinding(value: unknown): value is CircuitValueBinding {
  return (
    isRecord(value) &&
    typeof value.path === "string" &&
    value.path.length > 0 &&
    (value.sourceUnit === undefined || typeof value.sourceUnit === "string") &&
    (value.unit === undefined || typeof value.unit === "string") &&
    (value.prefix === undefined || typeof value.prefix === "string") &&
    (value.suffix === undefined || typeof value.suffix === "string") &&
    (value.significantDigits === undefined ||
      (Number.isInteger(value.significantDigits) &&
        Number(value.significantDigits) >= 1 &&
        Number(value.significantDigits) <= 12)) &&
    (value.engineering === undefined || typeof value.engineering === "boolean")
  );
}

function isCircuitValue(value: unknown): value is CircuitValue {
  if (isBinding(value)) return true;
  if (!isRecord(value) || typeof value.template !== "string") return false;
  if (!isRecord(value.bindings)) return false;
  return Object.values(value.bindings).every(isBinding);
}

function hasValidSharedFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    (value.label === undefined || typeof value.label === "string") &&
    isLabel(value.labelPosition) &&
    (value.value === undefined || isCircuitValue(value.value))
  );
}

function isElement(value: unknown): value is CircuitElement {
  if (!isRecord(value) || !hasValidSharedFields(value)) return false;
  if (typeof value.type !== "string" || !elementTypes.has(value.type)) {
    return false;
  }
  if (
    ["resistor", "capacitor", "inductor", "voltageSource"].includes(value.type)
  ) {
    return isPoint(value.from) && isPoint(value.to);
  }
  if (value.type === "opAmp") {
    return (
      isPoint(value.center) &&
      isFiniteNumber(value.width) &&
      value.width > 0 &&
      isFiniteNumber(value.height) &&
      value.height > 0 &&
      (value.direction === undefined ||
        value.direction === "right" ||
        value.direction === "left")
    );
  }
  return (
    isPoint(value.at) &&
    (value.direction === undefined ||
      value.direction === "down" ||
      value.direction === "up")
  );
}

function isAnnotation(value: unknown): value is CircuitAnnotation {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (!annotationTypes.has(value.type)) return false;
  if (value.type === "node") return isPoint(value.at);
  if (value.type === "currentArrow") {
    return (
      isPoint(value.from) &&
      isPoint(value.to) &&
      (value.label === undefined || typeof value.label === "string") &&
      isLabel(value.labelPosition)
    );
  }
  if (value.type === "polarity") {
    return (
      isPoint(value.plus) &&
      isPoint(value.minus) &&
      (value.label === undefined || typeof value.label === "string") &&
      isLabel(value.labelPosition)
    );
  }
  return (
    isPoint(value.at) &&
    typeof value.text === "string" &&
    (value.anchor === undefined ||
      value.anchor === "start" ||
      value.anchor === "middle" ||
      value.anchor === "end") &&
    (value.value === undefined || isCircuitValue(value.value))
  );
}

function validateCircuitScene(
  value: unknown,
  context = "Circuit",
): CircuitScene {
  if (!isRecord(value)) throw new Error(`${context} scene must be an object.`);
  if (
    !Array.isArray(value.viewBox) ||
    value.viewBox.length !== 4 ||
    !value.viewBox.every(isFiniteNumber) ||
    Number(value.viewBox[2]) <= 0 ||
    Number(value.viewBox[3]) <= 0
  ) {
    throw new Error(
      `${context} viewBox must contain four finite numbers with positive dimensions.`,
    );
  }
  if (typeof value.ariaLabel !== "string" || !value.ariaLabel.trim()) {
    throw new Error(`${context} ariaLabel is required.`);
  }
  if (
    !Array.isArray(value.wires) ||
    !value.wires.every(
      (wire) =>
        isRecord(wire) &&
        Array.isArray(wire.points) &&
        wire.points.length >= 2 &&
        wire.points.every(isPoint),
    )
  ) {
    throw new Error(
      `${context} wires must be polylines containing at least two points.`,
    );
  }
  if (!Array.isArray(value.elements) || !value.elements.every(isElement)) {
    throw new Error(`${context} contains a malformed or unsupported element.`);
  }
  const ids = value.elements.map((element) => element.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${context} element IDs must be unique.`);
  }
  if (
    value.annotations !== undefined &&
    (!Array.isArray(value.annotations) ||
      !value.annotations.every(isAnnotation))
  ) {
    throw new Error(
      `${context} contains a malformed or unsupported annotation.`,
    );
  }
  return value as CircuitScene;
}

export function validateCircuitDefinition(value: unknown): CircuitDefinition {
  if (!isRecord(value))
    throw new Error("Circuit definition must be an object.");
  if (value.version === 1) {
    validateCircuitScene(value);
    return value as CircuitDefinitionV1;
  }
  if (value.version === 2) {
    if (
      !isRecord(value.selector) ||
      typeof value.selector.path !== "string" ||
      !value.selector.path.trim()
    ) {
      throw new Error("Circuit selector.path is required.");
    }
    if (!isRecord(value.variants) || Object.keys(value.variants).length === 0) {
      throw new Error("Circuit variants must contain at least one scene.");
    }
    for (const [variantId, scene] of Object.entries(value.variants)) {
      if (!variantId.trim())
        throw new Error("Circuit variant IDs cannot be empty.");
      validateCircuitScene(scene, `Circuit variant "${variantId}"`);
    }
    return value as CircuitDefinitionV2;
  }
  throw new Error(
    `Unsupported circuit definition version: ${String(value.version)}.`,
  );
}

export function selectCircuitScene(
  definition: CircuitDefinition,
  params: Record<string, unknown>,
): CircuitScene {
  if (definition.version === 1) return definition;
  const selectorValue = lookupParameter(params, definition.selector.path);
  if (typeof selectorValue !== "string" || !selectorValue) {
    throw new Error(
      `Circuit variant selector "${definition.selector.path}" is missing.`,
    );
  }
  if (!Object.hasOwn(definition.variants, selectorValue)) {
    throw new Error(
      `Unknown circuit variant "${selectorValue}" for selector "${definition.selector.path}".`,
    );
  }
  return definition.variants[selectorValue];
}

const unitAliases: Record<string, { baseUnit: string; multiplier: number }> = {
  F: { baseUnit: "F", multiplier: 1 },
  mF: { baseUnit: "F", multiplier: 1e-3 },
  µF: { baseUnit: "F", multiplier: 1e-6 },
  uF: { baseUnit: "F", multiplier: 1e-6 },
  nF: { baseUnit: "F", multiplier: 1e-9 },
  pF: { baseUnit: "F", multiplier: 1e-12 },
  H: { baseUnit: "H", multiplier: 1 },
  mH: { baseUnit: "H", multiplier: 1e-3 },
  µH: { baseUnit: "H", multiplier: 1e-6 },
  uH: { baseUnit: "H", multiplier: 1e-6 },
  Ohm: { baseUnit: "Ω", multiplier: 1 },
  ohm: { baseUnit: "Ω", multiplier: 1 },
  Ω: { baseUnit: "Ω", multiplier: 1 },
  kOhm: { baseUnit: "Ω", multiplier: 1e3 },
  kΩ: { baseUnit: "Ω", multiplier: 1e3 },
  V: { baseUnit: "V", multiplier: 1 },
  A: { baseUnit: "A", multiplier: 1 },
  Hz: { baseUnit: "Hz", multiplier: 1 },
  "rad/s": { baseUnit: "rad/s", multiplier: 1 },
  "°": { baseUnit: "°", multiplier: 1 },
};

const engineeringPrefixes: Record<number, string> = {
  [-12]: "p",
  [-9]: "n",
  [-6]: "µ",
  [-3]: "m",
  0: "",
  3: "k",
  6: "M",
  9: "G",
  12: "T",
};

export function lookupParameter(
  params: Record<string, unknown>,
  path: string,
): unknown {
  const parts = path
    .replace(
      /\[(?:"([^"]+)"|'([^']+)'|(\d+))\]/g,
      (_, a, b, c) => `.${a ?? b ?? c}`,
    )
    .split(".")
    .filter(Boolean);
  let current: unknown = params;
  for (const part of parts) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function toSignificantDigits(value: number, digits: number): string {
  if (value === 0) return "0";
  return Number(value.toPrecision(digits)).toString();
}

export function formatCircuitBinding(
  binding: CircuitValueBinding,
  params: Record<string, unknown>,
): string {
  const raw = lookupParameter(params, binding.path);
  if (raw === undefined || raw === null) return "—";
  if (typeof raw !== "number") {
    return `${binding.prefix ?? ""}${String(raw)}${binding.suffix ?? ""}`;
  }
  if (!Number.isFinite(raw)) return "—";

  const source = binding.sourceUnit
    ? unitAliases[binding.sourceUnit]
    : undefined;
  if (binding.sourceUnit && !source) {
    throw new Error(`Unsupported source unit: ${binding.sourceUnit}.`);
  }
  const requestedUnit = binding.unit ?? source?.baseUnit ?? "";
  const requested = requestedUnit ? unitAliases[requestedUnit] : undefined;
  if (requestedUnit && !requested && binding.engineering !== false) {
    throw new Error(`Unsupported display unit: ${requestedUnit}.`);
  }
  if (source && requested && source.baseUnit !== requested.baseUnit) {
    throw new Error(`Cannot convert ${binding.sourceUnit} to ${binding.unit}.`);
  }

  let numericValue = raw * (source?.multiplier ?? 1);
  let displayUnit = requested?.baseUnit ?? requestedUnit;
  if (binding.engineering === false) {
    numericValue /= requested?.multiplier ?? 1;
  } else if (displayUnit && numericValue !== 0) {
    const exponent = Math.max(
      -12,
      Math.min(12, Math.floor(Math.log10(Math.abs(numericValue)) / 3) * 3),
    );
    numericValue /= 10 ** exponent;
    displayUnit = `${engineeringPrefixes[exponent]}${displayUnit}`;
  }

  const number = toSignificantDigits(
    numericValue,
    binding.significantDigits ?? 3,
  );
  const unit = displayUnit ? ` ${displayUnit}` : "";
  return `${binding.prefix ?? ""}${number}${unit}${binding.suffix ?? ""}`;
}

export function formatCircuitValue(
  value: CircuitValue | undefined,
  params: Record<string, unknown>,
): string | undefined {
  if (!value) return undefined;
  if ("path" in value) return formatCircuitBinding(value, params);
  return Object.entries(value.bindings).reduce(
    (output, [name, binding]) =>
      output.replaceAll(`{${name}}`, formatCircuitBinding(binding, params)),
    value.template,
  );
}
