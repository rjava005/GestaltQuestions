import { describe, expect, it } from "vitest";

import { validateBlockDiagramDefinition } from "./blockDiagramDefinition";
import {
  traceRegionPoints,
  validateSignalPlotDefinition,
} from "./signalPlotDefinition";

describe("signal-plot asset contract", () => {
  it("accepts all v1 trace kinds and interactions", () => {
    const definition = validateSignalPlotDefinition({
      version: 1,
      ariaLabel: "Signals",
      axes: { x: { min: -1, max: 1 }, y: { min: -2, max: 2 } },
      traces: [
        { id: "c", kind: "continuous", x: [-1, 0, 1], y: [1, 0, 1] },
        { id: "d", kind: "discrete", x: [0, 1], y: [1, 2] },
        { id: "i", kind: "impulse", x: [0], y: [1] },
        {
          id: "p",
          kind: "piecewise",
          xBinding: { path: "p.x" },
          yBinding: { path: "p.y" },
        },
      ],
      markers: [{ id: "m", answerName: "m", x: 0, draggable: true }],
      intervals: [
        { id: "r", answerName: "r", start: 0, end: 1, draggable: true },
      ],
      shadedRegions: [{ x1: -0.5, x2: 0.5, traceId: "p" }],
      interactions: { cursor: true, zoomPan: true, traceToggles: true },
    });
    expect(definition.traces.map((trace) => trace.kind)).toEqual([
      "continuous",
      "discrete",
      "impulse",
      "piecewise",
    ]);
  });

  it("rejects duplicate, non-finite, and mismatched traces", () => {
    const base = {
      version: 1,
      ariaLabel: "Bad",
      axes: { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } },
    };
    expect(() =>
      validateSignalPlotDefinition({
        ...base,
        traces: [
          { id: "x", kind: "continuous", x: [0], y: [0] },
          { id: "x", kind: "continuous", x: [0], y: [0] },
        ],
      }),
    ).toThrow("malformed trace");
    expect(() =>
      validateSignalPlotDefinition({
        ...base,
        traces: [{ id: "x", kind: "continuous", x: [0, 1], y: [0] }],
      }),
    ).toThrow("equal finite x/y");
  });

  it("validates under-trace regions and preserves rectangular regions", () => {
    const definition = validateSignalPlotDefinition({
      version: 1,
      ariaLabel: "Area",
      axes: { x: { min: 0, max: 3 }, y: { min: -1, max: 4 } },
      traces: [{ id: "ramp", kind: "continuous", x: [0, 1, 3], y: [0, 2, 3] }],
      shadedRegions: [
        { x1: 0.5, x2: 2, traceId: "ramp", baseline: -1 },
        { x1: 0, x2: 1, y1: 0, y2: 1 },
      ],
    });
    expect(definition.shadedRegions?.[0].baseline).toBe(-1);
    expect(definition.shadedRegions?.[1].traceId).toBeUndefined();
  });

  it("interpolates authored region boundaries", () => {
    expect(traceRegionPoints([0, 1, 3], [0, 2, 3], 0.5, 2)).toEqual([
      [0.5, 1],
      [1, 2],
      [2, 2.5],
    ]);
  });

  it("rejects malformed and unsupported under-trace regions", () => {
    const make = (region: Record<string, unknown>) => ({
      version: 1,
      ariaLabel: "Area",
      axes: { x: { min: 0, max: 2 }, y: { min: 0, max: 2 } },
      traces: [
        { id: "line", kind: "continuous", x: [0, 2], y: [0, 2] },
        { id: "samples", kind: "discrete", x: [0, 2], y: [0, 2] },
      ],
      shadedRegions: [region],
    });
    expect(() =>
      validateSignalPlotDefinition(make({ x1: 0, x2: 1, traceId: "missing" })),
    ).toThrow("unknown trace");
    expect(() =>
      validateSignalPlotDefinition(make({ x1: 0, x2: 1, traceId: "samples" })),
    ).toThrow("continuous or piecewise");
    expect(() =>
      validateSignalPlotDefinition(make({ x1: 1, x2: 0, traceId: "line" })),
    ).toThrow("malformed shaded region");
    expect(() =>
      validateSignalPlotDefinition(
        make({ x1: 0, x2: 1, traceId: "line", baseline: Infinity }),
      ),
    ).toThrow("malformed shaded region");
    expect(() =>
      validateSignalPlotDefinition(make({ x1: 0, x2: 1, y2: NaN })),
    ).toThrow("malformed shaded region");
    expect(() =>
      validateSignalPlotDefinition(make({ x1: -1, x2: 1, traceId: "line" })),
    ).toThrow("bounds");
  });
});

describe("block-diagram asset contract", () => {
  it("accepts every block primitive and embedded answer slots", () => {
    const types = [
      "transfer",
      "function",
      "gain",
      "sum",
      "mixer",
      "pickoff",
      "source",
      "sink",
      "integrator",
      "delay",
      "label",
    ];
    const definition = validateBlockDiagramDefinition({
      version: 1,
      ariaLabel: "Control loop",
      viewBox: [0, 0, 600, 300],
      nodes: types.map((type, index) => ({
        id: `${type}-${index}`,
        type,
        at: [20 + index * 40, 100],
      })),
      wires: [
        {
          points: [
            [0, 0],
            [20, 0],
            [20, 20],
          ],
          feedback: true,
        },
      ],
      answerSlots: [
        {
          id: "a",
          answerName: "tf",
          at: [300, 200],
          width: 120,
          height: 40,
          kind: "math",
        },
      ],
    });
    expect(definition.nodes).toHaveLength(types.length);
    expect(definition.answerSlots?.[0].answerName).toBe("tf");
  });

  it("rejects implicit or unsupported layout data", () => {
    expect(() =>
      validateBlockDiagramDefinition({
        version: 1,
        ariaLabel: "Bad",
        viewBox: [0, 0, 1, 1],
        nodes: [{ id: "x", type: "auto", at: [0, 0] }],
        wires: [],
      }),
    ).toThrow("malformed node");
  });
});
