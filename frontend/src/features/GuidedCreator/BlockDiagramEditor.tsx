import { useRef, useState } from "react";

import { CIRCUIT_GRID_SIZE } from "../QuestionEngine/render/components/content/circuitDefinition";
import {
  type BlockAnswerSlot,
  type BlockDiagramDefinition,
  type BlockNode,
  type BlockPoint,
  validateBlockDiagramDefinition,
} from "../QuestionEngine/render/components/visuals/blockDiagramDefinition";
import {
  BlockDiagramGeometry,
  blockSlotBoxStyle,
} from "../QuestionEngine/render/components/visuals/PLBlockDiagram";
import type { ParameterDefinition } from "./types";

const GRID = CIRCUIT_GRID_SIZE;
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 360;
// Matches the renderer's fallbacks in PLBlockDiagram's Node component.
const ROUND_NODE_WIDTH = 36;
const BLOCK_NODE_WIDTH = 110;
const NODE_HEIGHT = 58;
const SLOT_WIDTH = GRID * 6;
const SLOT_HEIGHT = GRID * 3;
const PORT_SNAP_RADIUS = GRID * 1.5;

type NodeTool = BlockNode["type"];
type Tool = "select" | "wire" | "answer" | NodeTool;
type Selection = { kind: "node" | "wire" | "answer"; index: number } | null;

const NODE_TOOLS: NodeTool[] = [
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

const TOOLS: Array<[Tool, string]> = [
  ["select", "Select"],
  ["wire", "Wire"],
  ["answer", "Answer slot"],
  ["transfer", "Transfer"],
  ["function", "Function"],
  ["gain", "Gain"],
  ["sum", "Sum"],
  ["mixer", "Mixer"],
  ["pickoff", "Pickoff"],
  ["source", "Source"],
  ["sink", "Sink"],
  ["integrator", "Integrator"],
  ["delay", "Delay"],
  ["label", "Label"],
];

const snap = (value: number) => Math.round(value / GRID) * GRID;
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));
const samePoint = (a: BlockPoint, b: BlockPoint) =>
  a[0] === b[0] && a[1] === b[1];
const isNodeTool = (tool: Tool): tool is NodeTool =>
  (NODE_TOOLS as string[]).includes(tool);

export const EMPTY_BLOCK_DIAGRAM: BlockDiagramDefinition = {
  version: 1,
  ariaLabel: "",
  viewBox: [0, 0, CANVAS_WIDTH, CANVAS_HEIGHT],
  nodes: [],
  wires: [],
  answerSlots: [],
};

export default function BlockDiagramEditor({
  definition,
  parameters,
  onChange,
}: {
  definition: BlockDiagramDefinition;
  parameters: ParameterDefinition[];
  onChange: (definition: BlockDiagramDefinition) => void;
}) {
  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<Selection>(null);
  const [wirePoints, setWirePoints] = useState<BlockPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeDrag = useRef<{ index: number; origin: BlockPoint } | null>(null);
  const slotDrag = useRef<{ index: number; origin: BlockPoint } | null>(null);
  const wireDrag = useRef<{
    basePoints: BlockPoint[];
    start: BlockPoint;
  } | null>(null);
  const suppressWireClick = useRef(false);

  const slots = definition.answerSlots ?? [];

  // Where a wire can attach to a block: the midpoint of each vertical edge,
  // which is where signal flow enters and leaves. Round and label nodes only
  // offer their centre.
  const ports = definition.nodes.flatMap<BlockPoint>((node) => {
    const [x, y] = node.at;
    if (node.type === "label") return [];
    if (node.type === "pickoff") return [[x, y]];
    const half = (node.width ?? BLOCK_NODE_WIDTH) / 2;
    return [
      [x - half, y],
      [x + half, y],
    ];
  });

  const rawPoint = (event: {
    clientX: number;
    clientY: number;
  }): BlockPoint => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      clamp(
        snap(((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH),
        0,
        CANVAS_WIDTH,
      ),
      clamp(
        snap(((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT),
        0,
        CANVAS_HEIGHT,
      ),
    ];
  };

  // While wiring, pull the cursor onto a nearby block port so wires land on the
  // block instead of near it. Placement tools keep the plain grid.
  const pointFromEvent = (
    event: { clientX: number; clientY: number },
    attach = false,
  ): BlockPoint => {
    const point = rawPoint(event);
    if (!attach) return point;
    let best: BlockPoint | null = null;
    let bestDistance = PORT_SNAP_RADIUS;
    for (const port of ports) {
      const distance = Math.hypot(port[0] - point[0], port[1] - point[1]);
      if (distance <= bestDistance) {
        best = port;
        bestDistance = distance;
      }
    }
    return best ?? point;
  };

  // Every mutation goes through the same validator the renderer uses, so the
  // editor can never hand the question a file that will fail to render.
  const update = (changes: Partial<BlockDiagramDefinition>) => {
    const next = { ...definition, ...changes };
    try {
      validateBlockDiagramDefinition(next);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : String(validationError),
      );
      return;
    }
    setError(null);
    onChange(next);
  };

  const nextId = (prefix: string) => {
    let count = 1;
    const taken = new Set([
      ...definition.nodes.map((node) => node.id),
      ...slots.map((slot) => slot.id),
    ]);
    while (taken.has(`${prefix}${count}`)) count += 1;
    return `${prefix}${count}`;
  };

  const addNode = (type: NodeTool, at: BlockPoint) => {
    const round = type === "sum" || type === "mixer" || type === "pickoff";
    const node: BlockNode = {
      id: nextId(type),
      type,
      at,
      ...(type === "label" || type === "pickoff"
        ? {}
        : {
            width: round ? ROUND_NODE_WIDTH : BLOCK_NODE_WIDTH,
            height: NODE_HEIGHT,
          }),
      label: type === "label" ? "Label" : "",
    };
    update({ nodes: [...definition.nodes, node] });
    setSelection({ kind: "node", index: definition.nodes.length });
  };

  const addSlot = (at: BlockPoint) => {
    const slot: BlockAnswerSlot = {
      id: nextId("slot"),
      answerName: nextId("answer"),
      at,
      width: SLOT_WIDTH,
      height: SLOT_HEIGHT,
      kind: "numeric",
    };
    update({ answerSlots: [...slots, slot] });
    setSelection({ kind: "answer", index: slots.length });
  };

  const commitWire = (points: BlockPoint[]) => {
    if (points.length >= 2) {
      update({ wires: [...definition.wires, { points }] });
      setSelection({ kind: "wire", index: definition.wires.length });
    }
    setWirePoints([]);
  };

  const selectTool = (nextTool: Tool) => {
    // Leaving the wire tool keeps whatever has already been drawn rather than
    // discarding it -- a half-drawn wire silently vanishing reads as a bug.
    if (nextTool !== "wire" && wirePoints.length >= 2) commitWire(wirePoints);
    else if (nextTool !== "wire") setWirePoints([]);
    setTool(nextTool);
    setSelection(null);
  };

  const removeSelected = () => {
    if (!selection) return;
    if (selection.kind === "node")
      update({
        nodes: definition.nodes.filter((_, i) => i !== selection.index),
      });
    if (selection.kind === "wire")
      update({
        wires: definition.wires.filter((_, i) => i !== selection.index),
      });
    if (selection.kind === "answer")
      update({ answerSlots: slots.filter((_, i) => i !== selection.index) });
    setSelection(null);
  };

  const patchNode = (index: number, changes: Partial<BlockNode>) => {
    const nodes = [...definition.nodes];
    nodes[index] = { ...nodes[index], ...changes } as BlockNode;
    update({ nodes });
  };

  const patchSlot = (index: number, changes: Partial<BlockAnswerSlot>) => {
    const next = [...slots];
    next[index] = { ...next[index], ...changes };
    update({ answerSlots: next });
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event, tool === "wire");
    if (tool === "select") {
      setSelection(null);
      return;
    }
    if (tool === "wire") {
      // A drag already committed this wire; ignore the click that follows it.
      if (suppressWireClick.current) {
        suppressWireClick.current = false;
        return;
      }
      setWirePoints((points) =>
        points.length && samePoint(points[points.length - 1], point)
          ? points
          : [...points, point],
      );
      return;
    }
    if (tool === "answer") {
      addSlot(point);
      return;
    }
    if (isNodeTool(tool)) addNode(tool, point);
  };

  const selectedNode =
    selection?.kind === "node" ? definition.nodes[selection.index] : null;
  const selectedSlot =
    selection?.kind === "answer" ? slots[selection.index] : null;
  const selectedWire =
    selection?.kind === "wire" ? definition.wires[selection.index] : null;

  const bindingPath =
    selectedNode && selectedNode.value && typeof selectedNode.value === "object"
      ? ((selectedNode.value as { path?: string }).path ?? "")
      : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-bg">
        <BlockDiagramGeometry definition={definition} params={{}}>
          {slots.map((slot) => (
            <div
              key={slot.id}
              data-testid="answer-slot-outline"
              className="pointer-events-none absolute flex items-center justify-center rounded-md border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-surface-strong)]/70 text-[10px] font-semibold text-[var(--color-accent)]"
              style={blockSlotBoxStyle(slot, definition.viewBox)}
            >
              {slot.label ?? slot.answerName}
            </div>
          ))}
        </BlockDiagramGeometry>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          className={`absolute inset-0 h-full w-full touch-none ${tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
          onClick={handleClick}
          onDoubleClick={() => commitWire(wirePoints)}
          onPointerDown={(event) => {
            if (tool !== "wire") return;
            const start = pointFromEvent(event, true);
            const basePoints =
              wirePoints.length &&
              !samePoint(wirePoints[wirePoints.length - 1], start)
                ? [...wirePoints, start]
                : wirePoints.length
                  ? wirePoints
                  : [start];
            wireDrag.current = { basePoints, start };
            if (!wirePoints.length) setWirePoints([start]);
          }}
          onPointerMove={(event) => {
            if (tool !== "select") return;
            const nodeMove = nodeDrag.current;
            if (nodeMove) {
              const point = pointFromEvent(event);
              if (!samePoint(point, nodeMove.origin))
                patchNode(nodeMove.index, { at: point });
              return;
            }
            const slotMove = slotDrag.current;
            if (slotMove) {
              const point = pointFromEvent(event);
              if (!samePoint(point, slotMove.origin))
                patchSlot(slotMove.index, { at: point });
            }
          }}
          onPointerUp={(event) => {
            nodeDrag.current = null;
            slotDrag.current = null;
            const drag = wireDrag.current;
            wireDrag.current = null;
            if (!drag) return;
            const end = pointFromEvent(event, true);
            // A click without movement falls through to handleClick, which
            // appends the point for multi-segment wires.
            if (samePoint(drag.start, end)) return;
            suppressWireClick.current = true;
            const points = samePoint(
              drag.basePoints[drag.basePoints.length - 1],
              end,
            )
              ? drag.basePoints
              : [...drag.basePoints, end];
            commitWire(points);
          }}
          onPointerCancel={() => {
            nodeDrag.current = null;
            slotDrag.current = null;
            wireDrag.current = null;
          }}
          aria-label="Block diagram editing canvas"
        >
          <defs>
            <pattern
              id="block-editor-grid"
              x="-1.5"
              y="-1.5"
              width={GRID}
              height={GRID}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="1.5"
                cy="1.5"
                r="1.5"
                fill="var(--color-border)"
                opacity="0.9"
              />
            </pattern>
          </defs>
          <rect
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="url(#block-editor-grid)"
            pointerEvents="none"
          />

          {definition.wires.map((wire, index) => (
            <polyline
              key={wire.id ?? index}
              points={wire.points.map((point) => point.join(",")).join(" ")}
              fill="none"
              stroke="transparent"
              strokeWidth="18"
              pointerEvents={tool === "select" ? "stroke" : "none"}
              onClick={(event) => {
                event.stopPropagation();
                setSelection({ kind: "wire", index });
              }}
            />
          ))}

          {definition.nodes.map((node, index) => (
            <rect
              key={node.id}
              data-testid="node-handle"
              x={node.at[0] - (node.width ?? BLOCK_NODE_WIDTH) / 2}
              y={node.at[1] - (node.height ?? NODE_HEIGHT) / 2}
              width={node.width ?? BLOCK_NODE_WIDTH}
              height={node.height ?? NODE_HEIGHT}
              fill="transparent"
              stroke={
                selection?.kind === "node" && selection.index === index
                  ? "var(--color-accent)"
                  : "transparent"
              }
              strokeWidth="2"
              pointerEvents={tool === "select" ? "all" : "none"}
              onClick={(event) => {
                event.stopPropagation();
                setSelection({ kind: "node", index });
              }}
              onPointerDown={(event) => {
                if (tool !== "select") return;
                event.stopPropagation();
                nodeDrag.current = { index, origin: node.at };
                setSelection({ kind: "node", index });
              }}
            />
          ))}

          {slots.map((slot, index) => (
            <rect
              key={slot.id}
              data-testid="slot-handle"
              x={slot.at[0] - slot.width / 2}
              y={slot.at[1] - slot.height / 2}
              width={slot.width}
              height={slot.height}
              fill="transparent"
              stroke={
                selection?.kind === "answer" && selection.index === index
                  ? "var(--color-accent)"
                  : "transparent"
              }
              strokeWidth="2"
              pointerEvents={tool === "select" ? "all" : "none"}
              onClick={(event) => {
                event.stopPropagation();
                setSelection({ kind: "answer", index });
              }}
              onPointerDown={(event) => {
                if (tool !== "select") return;
                event.stopPropagation();
                slotDrag.current = { index, origin: slot.at };
                setSelection({ kind: "answer", index });
              }}
            />
          ))}

          {ports.map((port) => (
            <circle
              key={`${port[0]}-${port[1]}`}
              cx={port[0]}
              cy={port[1]}
              r={tool === "wire" ? 4 : 2.5}
              fill={
                tool === "wire" ? "var(--color-accent)" : "var(--color-border)"
              }
              pointerEvents="none"
            />
          ))}

          {wirePoints.length ? (
            <polyline
              points={wirePoints.map((point) => point.join(",")).join(" ")}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeDasharray="6 4"
              pointerEvents="none"
            />
          ) : null}
        </svg>
      </div>

      <div
        className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-2"
        aria-label="Block diagram palette"
      >
        {TOOLS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tool === value}
            onClick={() => selectTool(value)}
            className={`rounded-lg px-3 py-2 text-sm ${tool === value ? "bg-primary text-white" : "bg-surface-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        Click to place the selected block. With Wire selected, drag between two
        blocks to connect them — endpoints snap to the dots on each block edge —
        or click each corner and double-click to finish a multi-segment run.
        With Select, click a block or answer slot to edit it, and drag to move
        it. Coordinates are authored: nothing is routed or moved for you, so
        leave space around answer slots.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger,#b91c1c)]">
          {error}
        </p>
      ) : null}

      <label className="text-sm">
        Accessible description
        <input
          className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
          value={definition.ariaLabel}
          onChange={(event) => update({ ariaLabel: event.target.value })}
          placeholder="Unity-feedback loop with plant and controller"
        />
      </label>

      {selection ? (
        <div className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2">
          {selectedNode ? (
            <>
              <label className="text-sm">
                Unique ID
                <input
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedNode.id}
                  onChange={(event) =>
                    patchNode(selection.index, { id: event.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                Display label
                <input
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedNode.label ?? ""}
                  onChange={(event) =>
                    patchNode(selection.index, { label: event.target.value })
                  }
                />
              </label>
              {selectedNode.type === "sum" ? (
                <label className="text-sm">
                  Signs
                  <input
                    className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                    value={selectedNode.signs ?? ""}
                    onChange={(event) =>
                      patchNode(selection.index, { signs: event.target.value })
                    }
                    placeholder="+-"
                  />
                </label>
              ) : null}
              <label className="text-sm">
                Parameter binding
                <select
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={bindingPath}
                  onChange={(event) => {
                    const row = parameters.find(
                      (item) => item.name.trim() === event.target.value,
                    );
                    patchNode(selection.index, {
                      value: event.target.value
                        ? {
                            path: event.target.value,
                            sourceUnit: row?.unit || undefined,
                            significantDigits: 3,
                          }
                        : undefined,
                    });
                  }}
                >
                  <option value="">None</option>
                  {parameters
                    .filter((row) => row.name.trim())
                    .map((row) => (
                      <option key={row.id} value={row.name.trim()}>
                        {row.name.trim()} {row.unit ? `(${row.unit})` : ""}
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : null}

          {selectedSlot ? (
            <>
              <label className="text-sm">
                Answer name
                <input
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedSlot.answerName}
                  onChange={(event) =>
                    patchSlot(selection.index, {
                      answerName: event.target.value,
                    })
                  }
                />
              </label>
              <label className="text-sm">
                Answer kind
                <select
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedSlot.kind}
                  onChange={(event) =>
                    patchSlot(selection.index, {
                      kind: event.target.value as BlockAnswerSlot["kind"],
                    })
                  }
                >
                  <option value="numeric">Numeric</option>
                  <option value="math">Structured math</option>
                </select>
              </label>
              <label className="text-sm">
                Block width
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedSlot.width}
                  onChange={(event) =>
                    patchSlot(selection.index, {
                      width: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="text-sm">
                Block height
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedSlot.height}
                  onChange={(event) =>
                    patchSlot(selection.index, {
                      height: Number(event.target.value),
                    })
                  }
                />
              </label>
            </>
          ) : null}

          {selectedWire ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedWire.feedback ?? false}
                onChange={(event) => {
                  const wires = [...definition.wires];
                  wires[selection.index] = {
                    ...selectedWire,
                    feedback: event.target.checked || undefined,
                  };
                  update({ wires });
                }}
              />
              Feedback path
            </label>
          ) : null}

          <button
            type="button"
            onClick={removeSelected}
            className="justify-self-start rounded-lg bg-surface-muted px-3 py-2 text-sm"
          >
            Delete selected
          </button>
        </div>
      ) : null}
    </div>
  );
}
