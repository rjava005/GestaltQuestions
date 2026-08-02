import { describe, expect, it } from "vitest";

import {
  formatCircuitBinding,
  formatCircuitValue,
  lookupParameter,
  selectCircuitScene,
  validateCircuitDefinition,
} from "./circuitDefinition";

const validDefinition = {
  version: 1,
  viewBox: [0, 0, 100, 100],
  ariaLabel: "Test circuit",
  wires: [
    {
      points: [
        [0, 0],
        [10, 10],
      ],
    },
  ],
  elements: [
    {
      id: "R1",
      type: "resistor",
      from: [10, 10],
      to: [50, 10],
      label: "R₁",
      labelPosition: { at: [30, 30] },
      value: { path: "nested.resistance", sourceUnit: "Ohm", unit: "Ω" },
    },
  ],
};

describe("validateCircuitDefinition", () => {
  it("accepts a version 1 authored circuit", () => {
    const definition = validateCircuitDefinition(validDefinition);
    expect(definition.version).toBe(1);
    if (definition.version !== 1) throw new Error("Expected a v1 definition");
    expect(definition.ariaLabel).toBe("Test circuit");
  });

  it("rejects unsupported versions and element types", () => {
    expect(() =>
      validateCircuitDefinition({ ...validDefinition, version: 3 }),
    ).toThrow("Unsupported circuit definition version");
    expect(() =>
      validateCircuitDefinition({
        ...validDefinition,
        elements: [{ id: "X", type: "transistor" }],
      }),
    ).toThrow("malformed or unsupported element");
  });

  it("validates and selects version 2 scenes", () => {
    const scene = {
      viewBox: validDefinition.viewBox,
      ariaLabel: validDefinition.ariaLabel,
      wires: validDefinition.wires,
      elements: validDefinition.elements,
    };
    const definition = validateCircuitDefinition({
      version: 2,
      selector: { path: "circuitVariant" },
      variants: { lowPass: scene, highPass: { ...scene, ariaLabel: "Other" } },
    });

    expect(
      selectCircuitScene(definition, { circuitVariant: "highPass" }).ariaLabel,
    ).toBe("Other");
    expect(() => selectCircuitScene(definition, {})).toThrow(
      'selector "circuitVariant" is missing',
    );
    expect(() =>
      selectCircuitScene(definition, { circuitVariant: "bandPass" }),
    ).toThrow('Unknown circuit variant "bandPass"');
  });

  it("rejects malformed version 2 selectors and scenes", () => {
    expect(() =>
      validateCircuitDefinition({ version: 2, selector: {}, variants: {} }),
    ).toThrow("selector.path");
    expect(() =>
      validateCircuitDefinition({
        version: 2,
        selector: { path: "variant" },
        variants: { broken: { viewBox: [0, 0, 0, 100] } },
      }),
    ).toThrow('Circuit variant "broken" viewBox');
  });
});

describe("circuit parameter formatting", () => {
  it("looks up nested and bracketed parameter paths", () => {
    expect(
      lookupParameter({ nested: { values: [7] } }, "nested.values[0]"),
    ).toBe(7);
  });

  it("converts source units and selects engineering prefixes", () => {
    expect(
      formatCircuitBinding(
        { path: "c", sourceUnit: "mF", unit: "F", significantDigits: 3 },
        { c: 0.001 },
      ),
    ).toBe("1 µF");
    expect(
      formatCircuitBinding(
        { path: "l", sourceUnit: "H", unit: "H", significantDigits: 3 },
        { l: 0.02 },
      ),
    ).toBe("20 mH");
    expect(
      formatCircuitBinding(
        { path: "r", sourceUnit: "Ohm", unit: "Ω", significantDigits: 3 },
        { r: 100000 },
      ),
    ).toBe("100 kΩ");
  });

  it("formats named template bindings", () => {
    expect(
      formatCircuitValue(
        {
          template: "{amplitude} cos({frequency}t) V",
          bindings: {
            amplitude: {
              path: "amplitude",
              significantDigits: 3,
              engineering: false,
            },
            frequency: {
              path: "frequency",
              significantDigits: 3,
              engineering: false,
            },
          },
        },
        { amplitude: 50, frequency: 200 },
      ),
    ).toBe("50 cos(200t) V");
  });
});
