/* global HTMLElement */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuestionInstanceProvider } from "../../../instance";
import type { BlockDiagramDefinition } from "./blockDiagramDefinition";
import { BlockDiagramScene } from "./PLBlockDiagram";

vi.mock("../math/StructuredMathInput", () => ({
  default: ({
    answerName,
    label,
    className,
    fieldClassName,
  }: {
    answerName: string;
    label: string;
    className?: string;
    fieldClassName?: string;
  }) => (
    <div className={className}>
      <input
        aria-label={label}
        data-math-answer-field={answerName}
        className={fieldClassName}
      />
    </div>
  ),
}));

const definition: BlockDiagramDefinition = {
  version: 1,
  ariaLabel: "Accessible feedback loop",
  viewBox: [0, 0, 760, 560],
  nodes: [
    { id: "source", type: "source", at: [60, 100], label: "R(s)" },
    { id: "sum", type: "sum", at: [160, 100], signs: "+ -" },
    { id: "gain", type: "gain", at: [280, 100], label: "K" },
  ],
  wires: [
    {
      points: [
        [100, 100],
        [140, 100],
      ],
      label: "input",
    },
  ],
  answerSlots: [
    {
      id: "dc",
      answerName: "dc_gain",
      at: [380, 365],
      width: 220,
      height: 72,
      kind: "numeric",
      label: "DC gain",
    },
    {
      id: "tf",
      answerName: "closed_loop",
      at: [380, 475],
      width: 440,
      height: 80,
      kind: "math",
      label: "Closed-loop transfer function",
    },
  ],
};

function renderScene() {
  return render(
    <QuestionInstanceProvider
      initialState={{
        qmeta: { id: "question-1", storage_type: "local" } as never,
        quiz_data: { params: {}, correct_answers: {} },
      }}
    >
      <BlockDiagramScene definition={definition} params={{}} />
    </QuestionInstanceProvider>,
  );
}

afterEach(cleanup);

describe("BlockDiagramScene", () => {
  it("uses the theme foreground for every SVG label", () => {
    const { container } = renderScene();
    const labels = [...container.querySelectorAll("svg text")];

    expect(labels.length).toBeGreaterThan(0);
    expect(
      labels.every(
        (label) =>
          label.getAttribute("fill") === "var(--color-text, currentColor)",
      ),
    ).toBe(true);
  });

  it("contains fields in accent-outlined blocks with authored dimensions", () => {
    const { container } = renderScene();
    const numeric = container.querySelector<HTMLElement>(
      "[data-block-answer='dc_gain']",
    );
    const math = container.querySelector<HTMLElement>(
      "[data-block-answer='closed_loop']",
    );

    expect(numeric).not.toBeNull();
    expect(numeric).toHaveClass("border-2", "border-[var(--color-accent)]");
    expect(numeric).not.toHaveClass("-translate-x-1/2", "-translate-y-1/2");
    expect(numeric?.style.left).toBe(`${((380 - 220 / 2) / 760) * 100}%`);
    expect(numeric?.style.top).toBe(`${((365 - 72 / 2) / 560) * 100}%`);
    expect(numeric?.style.width).toBe(`${(220 / 760) * 100}%`);
    expect(numeric?.style.height).toBe(`${(72 / 560) * 100}%`);
    expect(math?.style.width).toBe(`${(440 / 760) * 100}%`);
    expect(math?.style.height).toBe(`${(80 / 560) * 100}%`);
    expect(screen.getByRole("spinbutton", { name: "DC gain" })).toHaveClass(
      "border-2",
      "border-[var(--color-accent)]",
    );
    expect(
      screen.getByRole("textbox", {
        name: "Closed-loop transfer function",
      }),
    ).toHaveClass(
      "embedded-answer-math-field",
      "border-2",
      "border-[var(--color-accent)]",
      "!py-0",
    );
  });
});
