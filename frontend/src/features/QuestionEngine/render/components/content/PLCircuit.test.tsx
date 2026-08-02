import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  QuestionInstanceProvider,
  useQuestionInstance,
} from "../../../instance";
import PLCircuit from "./PLCircuit";

const allSymbolsDefinition = {
  version: 1,
  viewBox: [0, 0, 500, 300],
  ariaLabel: "All circuit symbols",
  wires: [
    {
      points: [
        [0, 0],
        [20, 0],
      ],
    },
  ],
  elements: [
    {
      id: "R",
      type: "resistor",
      from: [20, 20],
      to: [100, 20],
      label: "R",
      labelPosition: { at: [60, 45] },
      value: { path: "r", sourceUnit: "Ω", unit: "Ω" },
    },
    {
      id: "C",
      type: "capacitor",
      from: [120, 20],
      to: [200, 20],
      label: "C",
      labelPosition: { at: [160, 45] },
    },
    {
      id: "L",
      type: "inductor",
      from: [220, 20],
      to: [300, 20],
      label: "L",
      labelPosition: { at: [260, 45] },
    },
    {
      id: "V",
      type: "voltageSource",
      from: [330, 20],
      to: [410, 20],
      label: "V",
      labelPosition: { at: [370, 55] },
    },
    {
      id: "A",
      type: "opAmp",
      center: [100, 140],
      width: 80,
      height: 60,
      label: "A",
      labelPosition: { at: [100, 190] },
    },
    { id: "G", type: "ground", at: [220, 150] },
    { id: "T", type: "terminal", at: [300, 150] },
  ],
  annotations: [
    {
      type: "currentArrow",
      from: [20, 250],
      to: [80, 250],
      label: "i",
      labelPosition: { at: [50, 235] },
    },
    {
      type: "polarity",
      plus: [130, 240],
      minus: [130, 270],
      label: "v",
      labelPosition: { at: [150, 245] },
    },
    { type: "node", at: [220, 250] },
    { type: "text", at: [300, 250], text: "note" },
  ],
};

function RegenerateButton() {
  const setRunTimeContent = useQuestionInstance(
    (state) => state.setRunTimeContent,
  );
  return (
    <button
      onClick={() =>
        setRunTimeContent({
          instance: "second",
          qmeta: { id: "question-1", storage_type: "local" },
          question_html: "",
          logs: [],
          quiz_data: { params: { r: 200000 }, correct_answers: {} },
        } as never)
      }
    >
      Regenerate
    </button>
  );
}

const topologyDefinition = {
  version: 2,
  selector: { path: "circuitVariant" },
  variants: {
    lowPass: {
      viewBox: [0, 0, 100, 100],
      ariaLabel: "Series resistors scene",
      wires: [],
      elements: [{ id: "R1", type: "resistor", from: [10, 10], to: [80, 10] }],
    },
    highPass: {
      viewBox: [0, 0, 200, 100],
      ariaLabel: "Series capacitors scene",
      wires: [],
      elements: [{ id: "C1", type: "capacitor", from: [10, 10], to: [80, 10] }],
    },
  },
};

function ChangeTopologyButton({ variant }: { variant?: string }) {
  const setRunTimeContent = useQuestionInstance(
    (state) => state.setRunTimeContent,
  );
  return (
    <button
      onClick={() =>
        setRunTimeContent({
          instance: "next",
          qmeta: { id: "question-1", storage_type: "local" },
          question_html: "",
          logs: [],
          quiz_data: {
            params: variant ? { circuitVariant: variant } : {},
            correct_answers: {},
          },
        } as never)
      }
    >
      Change topology
    </button>
  );
}

function renderCircuit() {
  return render(
    <QuestionInstanceProvider
      initialState={{
        qmeta: { id: "question-1", storage_type: "local" } as never,
        quiz_data: { params: { r: 100000 }, correct_answers: {} },
      }}
    >
      <PLCircuit fileName="circuit.json" />
      <RegenerateButton />
    </QuestionInstanceProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PLCircuit", () => {
  it("renders every v1 symbol responsively with accessible current values", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => allSymbolsDefinition });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = renderCircuit();

    const svg = await screen.findByRole("img", { name: "All circuit symbols" });
    expect(svg).toHaveAttribute("viewBox", "0 0 500 300");
    expect(svg).toHaveClass("w-full");
    expect(container.querySelectorAll("[data-circuit-element]")).toHaveLength(
      7,
    );
    const sourceLines = container.querySelectorAll(
      "[data-circuit-element='V'] g > line",
    );
    expect(sourceLines[0]).toHaveAttribute("x2", "350");
    expect(sourceLines[1]).toHaveAttribute("x1", "373");
    expect(sourceLines[3]).toHaveAttribute("x1", "357");
    expect(sourceLines[4]).toHaveAttribute("x1", "390");
    const opAmpStubs = container.querySelectorAll(
      "[data-circuit-element='A'] g > line",
    );
    expect(opAmpStubs).toHaveLength(3);
    expect(opAmpStubs[0]).toHaveAttribute("x1", "40");
    expect(opAmpStubs[0]).toHaveAttribute("x2", "60");
    expect(opAmpStubs[2]).toHaveAttribute("x1", "160");
    expect(opAmpStubs[2]).toHaveAttribute("x2", "140");
    expect(svg.querySelector("desc")).toHaveTextContent("R: 100 kΩ");
    expect(screen.getByText("100 kΩ")).toBeInTheDocument();
  });

  it("redraws adaptive values without refetching topology", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => allSymbolsDefinition });
    vi.stubGlobal("fetch", fetchMock);
    renderCircuit();
    await screen.findByText("100 kΩ");

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await screen.findByText("200 kΩ");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("shows an inline error for malformed definitions", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ version: 1 }) }),
    );
    renderCircuit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to display circuit",
    );
  });

  it("redraws a selected v2 topology without refetching", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => topologyDefinition });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(
      <QuestionInstanceProvider
        initialState={{
          qmeta: { id: "question-1", storage_type: "local" } as never,
          quiz_data: {
            params: { circuitVariant: "lowPass" },
            correct_answers: {},
          },
        }}
      >
        <PLCircuit fileName="circuit.json" />
        <ChangeTopologyButton variant="highPass" />
      </QuestionInstanceProvider>,
    );

    await screen.findByRole("img", { name: "Series resistors scene" });
    expect(
      container.querySelector("[data-circuit-element='R1']"),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Change topology" }));
    const svg = await screen.findByRole("img", {
      name: "Series capacitors scene",
    });
    expect(svg).toHaveAttribute("viewBox", "0 0 200 100");
    expect(svg.querySelector("desc")).not.toHaveTextContent("Series resistors");
    expect(
      container.querySelector("[data-circuit-element='C1']"),
    ).not.toBeNull();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("shows an inline error when a v2 selector is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => topologyDefinition,
      }),
    );
    render(
      <QuestionInstanceProvider
        initialState={{
          qmeta: { id: "question-1", storage_type: "local" } as never,
          quiz_data: { params: {}, correct_answers: {} },
        }}
      >
        <PLCircuit fileName="circuit.json" />
      </QuestionInstanceProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      'selector "circuitVariant" is missing',
    );
  });
});
