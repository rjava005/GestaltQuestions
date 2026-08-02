import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { CircuitDefinitionV1 } from "../QuestionEngine/render/components/content/circuitDefinition";
import CircuitEditor, { EMPTY_CIRCUIT } from "./CircuitEditor";

function Harness() {
  const [scene, setScene] = useState<CircuitDefinitionV1>({
    ...EMPTY_CIRCUIT,
    ariaLabel: "Editable test circuit",
  });
  return (
    <>
      <CircuitEditor scene={scene} parameters={[]} onChange={setScene} />
      <output data-testid="scene-state">{JSON.stringify(scene)}</output>
    </>
  );
}

function setupCanvas() {
  render(<Harness />);
  const canvas = screen.getByLabelText("Circuit editing canvas");
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

function currentScene(): CircuitDefinitionV1 {
  return JSON.parse(screen.getByTestId("scene-state").textContent ?? "{}");
}

afterEach(cleanup);

describe("CircuitEditor placement", () => {
  it("previews and places a snapped horizontal component with one click", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Resistor" }));
    fireEvent(
      canvas,
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 303,
        clientY: 187,
      }),
    );

    expect(screen.getByTestId("component-preview")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "resistor placement preview" }),
    ).toBeInTheDocument();

    fireEvent.click(canvas, { clientX: 303, clientY: 187 });

    const [resistor] = currentScene().elements;
    expect(resistor).toMatchObject({
      id: "R1",
      type: "resistor",
      from: [260, 180],
      to: [340, 180],
    });
    expect(screen.getByRole("button", { name: "Select" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByTestId("component-preview")).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-circuit-node="260,180"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-circuit-node="340,180"]'),
    ).not.toBeNull();
  });

  it("clamps placement to the canvas and rotates in snapped 90 degree steps", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Capacitor" }));
    fireEvent(
      canvas,
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 0,
        clientY: 0,
      }),
    );
    fireEvent.click(canvas, { clientX: 0, clientY: 0 });

    let capacitor = currentScene().elements[0];
    expect(capacitor).toMatchObject({
      type: "capacitor",
      from: [0, 40],
      to: [80, 40],
    });

    fireEvent.click(screen.getByRole("button", { name: "Rotate component" }));
    capacitor = currentScene().elements[0];
    expect(capacitor).toMatchObject({
      from: [40, 0],
      to: [40, 80],
    });
    expect(capacitor.labelPosition?.at).toEqual([60, 40]);
  });

  it("drags a selected component in snapped grid steps", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Resistor" }));
    fireEvent.click(canvas, { clientX: 303, clientY: 187 });

    const overlay = document.querySelector(
      '[data-editor-element="R1"]',
    ) as SVGElement;
    fireEvent(
      overlay,
      new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 300,
        clientY: 180,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 407,
        clientY: 247,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointerup", {
        bubbles: true,
        clientX: 407,
        clientY: 247,
      }),
    );

    expect(currentScene().elements[0]).toMatchObject({
      from: [360, 240],
      to: [440, 240],
      labelPosition: { at: [400, 218] },
    });
  });

  it("creates a wire by dragging between component terminals", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Resistor" }));
    fireEvent.click(canvas, { clientX: 200, clientY: 180 });
    fireEvent.click(screen.getByRole("button", { name: "Resistor" }));
    fireEvent.click(canvas, { clientX: 400, clientY: 180 });
    fireEvent.click(screen.getByRole("button", { name: "Wire" }));

    fireEvent(
      canvas,
      new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 240,
        clientY: 180,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 360,
        clientY: 180,
      }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointerup", {
        bubbles: true,
        clientX: 360,
        clientY: 180,
      }),
    );

    expect(currentScene().wires).toEqual([
      {
        points: [
          [240, 180],
          [360, 180],
        ],
      },
    ]);
  });

  it("completes a wire when its second click lands on a terminal", () => {
    const canvas = setupCanvas();
    fireEvent.click(screen.getByRole("button", { name: "Resistor" }));
    fireEvent.click(canvas, { clientX: 200, clientY: 180 });
    fireEvent.click(screen.getByRole("button", { name: "Resistor" }));
    fireEvent.click(canvas, { clientX: 400, clientY: 180 });
    fireEvent.click(screen.getByRole("button", { name: "Wire" }));

    fireEvent.click(canvas, { clientX: 240, clientY: 180 });
    fireEvent.click(canvas, { clientX: 360, clientY: 180 });

    expect(currentScene().wires[0]?.points).toEqual([
      [240, 180],
      [360, 180],
    ]);
  });
});
