import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  type BlockDiagramDefinition,
  validateBlockDiagramDefinition,
} from "../QuestionEngine/render/components/visuals/blockDiagramDefinition";
import { BlockDiagramGeometry } from "../QuestionEngine/render/components/visuals/PLBlockDiagram";
import BlockDiagramEditor, { EMPTY_BLOCK_DIAGRAM } from "./BlockDiagramEditor";

function Harness() {
  const [definition, setDefinition] = useState<BlockDiagramDefinition>({
    ...EMPTY_BLOCK_DIAGRAM,
    ariaLabel: "Editable test diagram",
  });
  return (
    <>
      <BlockDiagramEditor
        definition={definition}
        parameters={[]}
        onChange={setDefinition}
      />
      <output data-testid="diagram-state">{JSON.stringify(definition)}</output>
    </>
  );
}

function setupCanvas() {
  render(<Harness />);
  const canvas = screen.getByLabelText("Block diagram editing canvas");
  Object.defineProperty(canvas, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: 360,
      height: 360,
      left: 0,
      right: 720,
      top: 0,
      width: 720,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
  return canvas;
}

function currentDefinition(): BlockDiagramDefinition {
  return JSON.parse(screen.getByTestId("diagram-state").textContent ?? "{}");
}

afterEach(cleanup);

describe("BlockDiagramEditor", () => {
  it("places a snapped node whose output passes the renderer's validator", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
    fireEvent.click(canvas, { clientX: 303, clientY: 187 });

    const definition = currentDefinition();
    expect(definition.nodes).toHaveLength(1);
    expect(definition.nodes[0]).toMatchObject({
      id: "transfer1",
      type: "transfer",
      at: [300, 180],
    });
    expect(() => validateBlockDiagramDefinition(definition)).not.toThrow();
  });

  it("uses the round-node width for sum blocks", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Sum" }));
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    expect(currentDefinition().nodes[0]).toMatchObject({
      type: "sum",
      width: 36,
    });
  });

  it("builds a wire from clicks and closes it on double click", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Wire" }));
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 300, clientY: 100 });
    fireEvent.doubleClick(canvas);

    expect(currentDefinition().wires).toEqual([
      {
        points: [
          [100, 100],
          [300, 100],
        ],
      },
    ]);
  });

  it("places an answer slot with authored dimensions and renames it", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Answer slot" }));
    fireEvent.click(canvas, { clientX: 200, clientY: 200 });

    expect(currentDefinition().answerSlots?.[0]).toMatchObject({
      at: [200, 200],
      width: 120,
      height: 60,
      kind: "numeric",
    });

    fireEvent.change(screen.getByLabelText("Answer name"), {
      target: { value: "gain" },
    });
    expect(currentDefinition().answerSlots?.[0].answerName).toBe("gain");
    expect(screen.getByTestId("answer-slot-outline")).toBeInTheDocument();
  });

  it("round-trips through JSON and renders the same node and wire counts", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Gain" }));
    fireEvent.click(canvas, { clientX: 300, clientY: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Wire" }));
    fireEvent.click(canvas, { clientX: 160, clientY: 100 });
    fireEvent.click(canvas, { clientX: 240, clientY: 100 });
    fireEvent.doubleClick(canvas);

    const authored = currentDefinition();
    const reparsed = validateBlockDiagramDefinition(
      JSON.parse(JSON.stringify(authored)),
    );

    cleanup();
    const { container } = render(
      <BlockDiagramGeometry definition={reparsed} params={{}} />,
    );

    expect(container.querySelectorAll("[data-block-node]")).toHaveLength(
      authored.nodes.length,
    );
    expect(container.querySelectorAll("polyline")).toHaveLength(
      authored.wires.length,
    );
  });

  it("connects two blocks by dragging between them, snapping to their ports", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
    fireEvent.click(canvas, { clientX: 200, clientY: 180 });
    fireEvent.click(screen.getByRole("button", { name: "Gain" }));
    fireEvent.click(canvas, { clientX: 460, clientY: 180 });
    fireEvent.click(screen.getByRole("button", { name: "Wire" }));

    // Drag from near the first block's right edge to near the second's left edge.
    fireEvent(
      canvas,
      new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 250,
        clientY: 182,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 400,
        clientY: 182,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointerup", {
        bubbles: true,
        clientX: 400,
        clientY: 182,
      }),
    );

    // Endpoints land exactly on the block edges, not merely near them.
    expect(currentDefinition().wires).toEqual([
      {
        points: [
          [255, 180],
          [405, 180],
        ],
      },
    ]);
  });

  it("keeps a half-drawn wire when switching back to Select", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Wire" }));
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 300, clientY: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Select" }));

    expect(currentDefinition().wires).toHaveLength(1);
  });

  it("selects, moves, and deletes an answer slot", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Answer slot" }));
    fireEvent.click(canvas, { clientX: 200, clientY: 200 });
    fireEvent.click(screen.getByRole("button", { name: "Select" }));

    const handle = document.querySelector(
      '[data-testid="slot-handle"]',
    ) as SVGElement;
    fireEvent(
      handle,
      new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 200,
        clientY: 200,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 340,
        clientY: 260,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointerup", {
        bubbles: true,
        clientX: 340,
        clientY: 260,
      }),
    );

    expect(currentDefinition().answerSlots?.[0].at).toEqual([340, 260]);

    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(currentDefinition().answerSlots).toHaveLength(0);
  });
});
