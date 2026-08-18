import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { QuestionInstanceProvider } from "../../../instance";
import { SignalPlotSvg } from "./PLSignalPlot";
import type { SignalPlotDefinition } from "./signalPlotDefinition";

const definition: SignalPlotDefinition = {
  version: 1,
  ariaLabel: "Ramp area",
  axes: {
    x: { min: 0, max: 2, label: "t", ticks: 2 },
    y: { min: 0, max: 2, label: "x(t)", ticks: 2 },
  },
  traces: [{ id: "line", kind: "continuous", x: [0, 1, 2], y: [0, 1, 2] }],
  shadedRegions: [
    {
      x1: 0.5,
      x2: 1.5,
      traceId: "line",
      baseline: 0,
      label: "area",
    },
  ],
  markers: [{ id: "target", answerName: "target", x: 1, label: "target" }],
};

afterEach(cleanup);

describe("SignalPlotSvg", () => {
  it("renders an interpolated under-trace region with theme-aware labels", () => {
    const { container } = render(
      <QuestionInstanceProvider
        initialState={{
          qmeta: { id: "question-1", storage_type: "local" } as never,
          quiz_data: { params: {}, correct_answers: {} },
        }}
      >
        <SignalPlotSvg definition={definition} params={{}} />
      </QuestionInstanceProvider>,
    );

    const region = container.querySelector(
      "[data-shaded-trace='line'] polygon",
    );
    expect(region).not.toBeNull();
    expect(region?.getAttribute("points")?.split(" ")).toHaveLength(5);

    const labels = [...container.querySelectorAll("svg text")];
    expect(labels.length).toBeGreaterThan(0);
    expect(
      labels.every(
        (label) =>
          label.getAttribute("fill") === "var(--color-text, currentColor)",
      ),
    ).toBe(true);
  });
});
