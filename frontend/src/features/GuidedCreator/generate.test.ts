import { describe, expect, it } from "vitest";

import { EMPTY_BLOCK_DIAGRAM } from "./BlockDiagramEditor";
import { EMPTY_CIRCUIT } from "./CircuitEditor";
import { generateGuidedArtifacts, markdownToSafeHtml, validateGuidedDraft } from "./generate";
import type { GuidedQuestionDraft } from "./types";

const draft = (changes: Partial<GuidedQuestionDraft> = {}): GuidedQuestionDraft => ({
  title: "Ohm's law",
  questionBody: "Find $V$ for **R = {{params.R}}**.",
  solutionBody: "$V={{correct_answers.V}}$.",
  parameters: [{ id: "p1", name: "R", type: "integer", minimum: "1", maximum: "10", unit: "Ohm", decimalPlaces: 0 }],
  answers: [{ id: "a1", name: "V", formula: "2 * R", inputLabel: "Voltage", unit: "V", significantDigits: 3 }],
  circuitEnabled: false,
  circuit: { ...EMPTY_CIRCUIT, wires: [], elements: [], annotations: [] },
  blockDiagramEnabled: false,
  blockDiagram: { ...EMPTY_BLOCK_DIAGRAM, nodes: [], wires: [], answerSlots: [] },
  ...changes,
});

describe("guided question validation", () => {
  it("accepts case-sensitive names but rejects exact trimmed duplicates", () => {
    expect(validateGuidedDraft(draft({ parameters: [
      { id: "1", name: "A", type: "integer", minimum: "1", maximum: "2", unit: "", decimalPlaces: 0 },
      { id: "2", name: "a", type: "integer", minimum: "1", maximum: "2", unit: "", decimalPlaces: 0 },
    ], questionBody: "{{params.A}} {{params.a}}", solutionBody: "{{correct_answers.x}}", answers: [{ id: "a", name: "x", formula: "A+a", inputLabel: "x", unit: "", significantDigits: 3 }] }))).toEqual([]);
    expect(validateGuidedDraft(draft({ parameters: [
      { id: "1", name: "R", type: "integer", minimum: "1", maximum: "2", unit: "", decimalPlaces: 0 },
      { id: "2", name: " R ", type: "integer", minimum: "1", maximum: "2", unit: "", decimalPlaces: 0 },
    ] }))).toContain('Parameter name "R" is duplicated.');
  });

  it("rejects unsafe formulas, unknown placeholders, and bad ranges", () => {
    const errors = validateGuidedDraft(draft({
      questionBody: "{{params.missing}}",
      parameters: [{ id: "p", name: "R", type: "integer", minimum: "2.5", maximum: "1", unit: "", decimalPlaces: 0 }],
      answers: [{ id: "a", name: "value", formula: "Math.sqrt(R)", inputLabel: "Value", unit: "", significantDigits: 3 }],
    }));
    expect(errors.join(" ")).toMatch(/minimum cannot exceed|integral bounds/);
    expect(errors.join(" ")).toContain("Unsupported token");
    expect(errors.join(" ")).toContain("unknown parameter");
  });

  it("requires valid, non-empty circuits and existing parameter bindings", () => {
    expect(validateGuidedDraft(draft({ circuitEnabled: true }))).toContain("Circuit cannot be empty.");
    const errors = validateGuidedDraft(draft({ circuitEnabled: true, circuit: {
      ...EMPTY_CIRCUIT,
      ariaLabel: "A resistor",
      elements: [{ id: "R1", type: "resistor", from: [20, 20], to: [100, 20], value: { path: "missing" } }],
    } }));
    expect(errors).toContain('Circuit element "R1" references missing parameter "missing".');
  });
});

describe("guided artifact generation", () => {
  it("escapes input markup while preserving LaTeX and placeholders", () => {
    expect(markdownToSafeHtml("<script>x</script> $x$ {{params.x}}"))
      .toBe("<p>&lt;script&gt;x&lt;/script&gt; $x$ {{params.x}}</p>");
  });

  it("creates equivalent runtime expressions and answer metadata", () => {
    const files = generateGuidedArtifacts(draft({ answers: [
      { id: "a", name: "V", formula: "sqrt(R^2) + pi", inputLabel: "Voltage", unit: "V", significantDigits: 4 },
    ] }));
    expect(files["question.html"]).toContain('digits="4" label="Voltage (V)"');
    expect(files["server.py"]).toContain("math.sqrt((R ** 2)) + math.pi");
    expect(files["server.js"]).toContain("Math.sqrt((R ** 2)) + Math.PI");
    expect(files["circuit.json"]).toBeUndefined();
  });

  it("always emits both runtimes for parameterless questions", () => {
    const files = generateGuidedArtifacts(draft({
      questionBody: "What is the constant?",
      parameters: [],
      answers: [{ id: "a", name: "constant", formula: "2*pi", inputLabel: "Constant", unit: "", significantDigits: 3 }],
      solutionBody: "{{correct_answers.constant}}",
    }));
    expect(files["server.py"]).toContain("math.pi");
    expect(files["server.js"]).toContain("Math.PI");
  });
});

describe("guided block diagrams", () => {
  const diagram = {
    ...EMPTY_BLOCK_DIAGRAM,
    ariaLabel: "Unity feedback loop",
    nodes: [{ id: "plant", type: "transfer" as const, at: [200, 180] as [number, number], label: "G(s)" }],
    wires: [{ points: [[100, 180], [200, 180]] as [number, number][] }],
  };
  const slot = (answerName: string) => ({ id: "s1", answerName, at: [300, 180] as [number, number], width: 120, height: 60, kind: "numeric" as const });

  it("emits block-diagram.json and the pl-block-diagram tag when enabled", () => {
    const artifacts = generateGuidedArtifacts(draft({ blockDiagramEnabled: true, blockDiagram: diagram }));
    expect(JSON.parse(artifacts["block-diagram.json"]!).nodes).toHaveLength(1);
    expect(artifacts["question.html"]).toContain('<pl-block-diagram file-name="block-diagram.json"></pl-block-diagram>');
  });

  it("omits the file entirely when the diagram is not enabled", () => {
    const artifacts = generateGuidedArtifacts(draft());
    expect(artifacts["block-diagram.json"]).toBeUndefined();
    expect(artifacts["question.html"]).not.toContain("pl-block-diagram");
  });

  it("rejects an enabled but empty diagram", () => {
    expect(validateGuidedDraft(draft({ blockDiagramEnabled: true }))).toContain("Block diagram cannot be empty.");
  });

  it("rejects an answer slot with no matching numeric answer", () => {
    const errors = validateGuidedDraft(draft({ blockDiagramEnabled: true, blockDiagram: { ...diagram, answerSlots: [slot("missing")] } }));
    expect(errors).toContain('Answer slot "missing" has no matching numeric answer.');
  });

  it("drops the standalone input for an answer already embedded in the diagram", () => {
    const artifacts = generateGuidedArtifacts(draft({ blockDiagramEnabled: true, blockDiagram: { ...diagram, answerSlots: [slot("V")] } }));
    expect(artifacts["question.html"]).not.toContain("pl-number-input");
  });
});
