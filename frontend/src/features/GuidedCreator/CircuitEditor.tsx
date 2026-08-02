import { useRef, useState } from "react";

import { CircuitSvg } from "../QuestionEngine/render/components/content/PLCircuit";
import {
  CIRCUIT_GRID_SIZE,
  getOpAmpTerminalStubs,
} from "../QuestionEngine/render/components/content/circuitDefinition";
import type {
  CircuitAnnotation,
  CircuitDefinitionV1,
  CircuitElement,
  CircuitPoint,
} from "../QuestionEngine/render/components/content/circuitDefinition";
import type { ParameterDefinition } from "./types";

type Tool =
  | "select"
  | "wire"
  | "resistor"
  | "capacitor"
  | "inductor"
  | "voltageSource"
  | "opAmp"
  | "label";
type PlaceableTool = Exclude<Tool, "select" | "wire" | "label">;
type Selection = {
  kind: "element" | "wire" | "annotation";
  index: number;
} | null;
const TOOLS: Array<[Tool, string]> = [
  ["select", "Select"],
  ["wire", "Wire"],
  ["resistor", "Resistor"],
  ["capacitor", "Capacitor"],
  ["inductor", "Inductor"],
  ["voltageSource", "Voltage Source"],
  ["opAmp", "Op Amp"],
  ["label", "Label"],
];
const GRID = CIRCUIT_GRID_SIZE;
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 360;
const COMPONENT_LENGTH = GRID * 4;
const OP_AMP_WIDTH = GRID * 4;
const OP_AMP_HEIGHT = GRID * 4;

const snap = (value: number) => Math.round(value / GRID) * GRID;
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));
const samePoint = (a: CircuitPoint, b: CircuitPoint) =>
  a[0] === b[0] && a[1] === b[1];
const isPlaceableTool = (tool: Tool): tool is PlaceableTool =>
  ["resistor", "capacitor", "inductor", "voltageSource", "opAmp"].includes(
    tool,
  );

function makePlacementElement(
  tool: PlaceableTool,
  rawPoint: CircuitPoint,
  id: string,
): CircuitElement {
  const point: CircuitPoint =
    tool === "opAmp"
      ? [
          clamp(
            rawPoint[0],
            OP_AMP_WIDTH / 2 + GRID,
            CANVAS_WIDTH - OP_AMP_WIDTH / 2 - GRID,
          ),
          clamp(
            rawPoint[1],
            OP_AMP_HEIGHT / 2 + GRID,
            CANVAS_HEIGHT - OP_AMP_HEIGHT / 2,
          ),
        ]
      : [
          clamp(
            rawPoint[0],
            COMPONENT_LENGTH / 2,
            CANVAS_WIDTH - COMPONENT_LENGTH / 2,
          ),
          clamp(rawPoint[1], GRID * 2, CANVAS_HEIGHT - GRID),
        ];
  if (tool === "opAmp")
    return {
      id,
      type: "opAmp",
      center: point,
      width: OP_AMP_WIDTH,
      height: OP_AMP_HEIGHT,
      direction: "right",
      label: "Op amp",
      labelPosition: { at: [point[0], point[1] - OP_AMP_HEIGHT / 2 - 15] },
    };
  const prefix = (
    {
      resistor: "R",
      capacitor: "C",
      inductor: "L",
      voltageSource: "V",
    } as const
  )[tool];
  return {
    id,
    type: tool,
    from: [point[0] - COMPONENT_LENGTH / 2, point[1]],
    to: [point[0] + COMPONENT_LENGTH / 2, point[1]],
    label: prefix,
    labelPosition: {
      at: [point[0], point[1] - (tool === "voltageSource" ? GRID * 2 : 22)],
    },
  };
}

function translateElement(
  element: CircuitElement,
  requestedDx: number,
  requestedDy: number,
): CircuitElement {
  const points: CircuitPoint[] =
    "from" in element
      ? [element.from, element.to]
      : element.type === "opAmp"
        ? [
            [
              element.center[0] - element.width / 2 - GRID,
              element.center[1] - element.height / 2,
            ],
            [
              element.center[0] + element.width / 2 + GRID,
              element.center[1] + element.height / 2,
            ],
          ]
        : [element.at];
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  const dx = clamp(requestedDx, -minX, CANVAS_WIDTH - maxX);
  const dy = clamp(requestedDy, -minY, CANVAS_HEIGHT - maxY);
  const shift = ([x, y]: CircuitPoint): CircuitPoint => [x + dx, y + dy];

  if ("from" in element)
    return {
      ...element,
      from: shift(element.from),
      to: shift(element.to),
      labelPosition: element.labelPosition
        ? { ...element.labelPosition, at: shift(element.labelPosition.at) }
        : undefined,
    };
  if (element.type === "opAmp")
    return {
      ...element,
      center: shift(element.center),
      labelPosition: element.labelPosition
        ? { ...element.labelPosition, at: shift(element.labelPosition.at) }
        : undefined,
    };
  return {
    ...element,
    at: shift(element.at),
    labelPosition: element.labelPosition
      ? { ...element.labelPosition, at: shift(element.labelPosition.at) }
      : undefined,
  };
}

function connectionPoints(scene: CircuitDefinitionV1): CircuitPoint[] {
  const points = scene.wires.flatMap((wire) => wire.points);
  scene.elements.forEach((element) => {
    if ("from" in element) points.push(element.from, element.to);
    else if (element.type === "opAmp")
      points.push(
        ...getOpAmpTerminalStubs(element).map((stub) => stub.terminal),
      );
  });
  return points.filter(
    (point, index) =>
      points.findIndex((candidate) => samePoint(candidate, point)) === index,
  );
}

export const EMPTY_CIRCUIT: CircuitDefinitionV1 = {
  version: 1,
  viewBox: [0, 0, CANVAS_WIDTH, CANVAS_HEIGHT],
  ariaLabel: "",
  wires: [],
  elements: [],
  annotations: [],
};

export default function CircuitEditor({
  scene,
  parameters,
  onChange,
}: {
  scene: CircuitDefinitionV1;
  parameters: ParameterDefinition[];
  onChange: (scene: CircuitDefinitionV1) => void;
}) {
  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<Selection>(null);
  const [cursorPoint, setCursorPoint] = useState<CircuitPoint | null>(null);
  const [wirePoints, setWirePoints] = useState<CircuitPoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const elementDrag = useRef<{
    index: number;
    origin: CircuitElement;
    start: CircuitPoint;
  } | null>(null);
  const wireDrag = useRef<{
    basePoints: CircuitPoint[];
    start: CircuitPoint;
  } | null>(null);
  const suppressWireClick = useRef(false);
  const pointFromEvent = (event: {
    clientX: number;
    clientY: number;
  }): CircuitPoint => {
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
  const update = (changes: Partial<CircuitDefinitionV1>) =>
    onChange({ ...scene, ...changes });
  const nextId = (prefix: string) => {
    let count =
      scene.elements.filter((element) => element.id.startsWith(prefix)).length +
      1;
    while (scene.elements.some((element) => element.id === `${prefix}${count}`))
      count += 1;
    return `${prefix}${count}`;
  };
  const addElement = (element: CircuitElement) => {
    update({ elements: [...scene.elements, element] });
    setSelection({ kind: "element", index: scene.elements.length });
  };
  const commitWire = (points: CircuitPoint[]) => {
    if (points.length >= 2) {
      update({ wires: [...scene.wires, { points }] });
      setSelection({ kind: "wire", index: scene.wires.length });
    }
    setWirePoints([]);
  };
  const finishWire = () => commitWire(wirePoints);
  const selectTool = (nextTool: Tool) => {
    setTool(nextTool);
    setCursorPoint(null);
    setSelection(null);
    if (nextTool !== "wire") setWirePoints([]);
  };
  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (tool === "select") {
      if (event.target === event.currentTarget) setSelection(null);
      return;
    }
    const point = pointFromEvent(event);
    if (tool === "wire") {
      if (suppressWireClick.current) {
        suppressWireClick.current = false;
        return;
      }
      if (
        wirePoints.length &&
        !samePoint(wirePoints[wirePoints.length - 1], point)
      ) {
        const nextPoints = [...wirePoints, point];
        const endsAtTerminal = connectionPoints(scene).some((terminal) =>
          samePoint(terminal, point),
        );
        if (endsAtTerminal) commitWire(nextPoints);
        else setWirePoints(nextPoints);
      } else if (!wirePoints.length) setWirePoints([point]);
    } else if (isPlaceableTool(tool)) {
      const prefix =
        tool === "opAmp"
          ? "U"
          : (
              {
                resistor: "R",
                capacitor: "C",
                inductor: "L",
                voltageSource: "V",
              } as const
            )[tool];
      addElement(makePlacementElement(tool, point, nextId(prefix)));
      setTool("select");
      setCursorPoint(null);
    } else if (tool === "label") {
      const annotations = [
        ...(scene.annotations ?? []),
        {
          type: "text",
          at: point,
          text: "Label",
          anchor: "middle",
        } as CircuitAnnotation,
      ];
      update({ annotations });
      setSelection({ kind: "annotation", index: annotations.length - 1 });
    }
  };
  const removeSelected = () => {
    if (!selection) return;
    if (selection.kind === "element")
      update({
        elements: scene.elements.filter(
          (_, index) => index !== selection.index,
        ),
      });
    if (selection.kind === "wire")
      update({
        wires: scene.wires.filter((_, index) => index !== selection.index),
      });
    if (selection.kind === "annotation")
      update({
        annotations: (scene.annotations ?? []).filter(
          (_, index) => index !== selection.index,
        ),
      });
    setSelection(null);
  };
  const rotateSelected = () => {
    if (!selection || selection.kind !== "element") return;
    const elements = [...scene.elements];
    const element = elements[selection.index];
    if ("from" in element) {
      const center: CircuitPoint = [
        snap((element.from[0] + element.to[0]) / 2),
        snap((element.from[1] + element.to[1]) / 2),
      ];
      const rotate = (point: CircuitPoint): CircuitPoint => [
        snap(center[0] - (point[1] - center[1])),
        snap(center[1] + (point[0] - center[0])),
      ];
      let from = rotate(element.from),
        to = rotate(element.to);
      const minX = Math.min(from[0], to[0]),
        maxX = Math.max(from[0], to[0]),
        minY = Math.min(from[1], to[1]),
        maxY = Math.max(from[1], to[1]);
      const dx =
        minX < 0 ? -minX : maxX > CANVAS_WIDTH ? CANVAS_WIDTH - maxX : 0;
      const dy =
        minY < 0 ? -minY : maxY > CANVAS_HEIGHT ? CANVAS_HEIGHT - maxY : 0;
      const shift = ([x, y]: CircuitPoint): CircuitPoint => [x + dx, y + dy];
      from = shift(from);
      to = shift(to);
      elements[selection.index] = {
        ...element,
        from,
        to,
        labelPosition: element.labelPosition
          ? {
              ...element.labelPosition,
              at: shift(rotate(element.labelPosition.at)),
            }
          : undefined,
      };
    } else if (element.type === "opAmp")
      elements[selection.index] = {
        ...element,
        direction: element.direction === "left" ? "right" : "left",
      };
    update({ elements });
  };
  const moveSelected = (dx: number, dy: number) => {
    if (!selection) return;
    if (selection.kind === "element") {
      const elements = [...scene.elements];
      elements[selection.index] = translateElement(
        elements[selection.index],
        dx,
        dy,
      );
      update({ elements });
    } else if (selection.kind === "wire") {
      const wires = [...scene.wires];
      wires[selection.index] = {
        points: wires[selection.index].points.map(([x, y]) => [x + dx, y + dy]),
      };
      update({ wires });
    } else {
      const annotations = [...(scene.annotations ?? [])],
        annotation = annotations[selection.index];
      if (annotation.type === "text" || annotation.type === "node")
        annotations[selection.index] = {
          ...annotation,
          at: [annotation.at[0] + dx, annotation.at[1] + dy],
        };
      update({ annotations });
    }
  };
  const selectedElement =
    selection?.kind === "element" ? scene.elements[selection.index] : undefined;
  const selectedAnnotation =
    selection?.kind === "annotation"
      ? scene.annotations?.[selection.index]
      : undefined;
  const selectedText =
    selectedAnnotation?.type === "text" ? selectedAnnotation : undefined;
  const binding =
    selectedElement?.value && "path" in selectedElement.value
      ? selectedElement.value.path
      : "";
  const previewElement =
    cursorPoint && isPlaceableTool(tool)
      ? makePlacementElement(tool, cursorPoint, "preview")
      : null;
  const previewScene: CircuitDefinitionV1 | null = previewElement
    ? {
        ...EMPTY_CIRCUIT,
        ariaLabel: `${tool} placement preview`,
        elements: [previewElement],
      }
    : null;
  const nodes = connectionPoints(
    previewElement
      ? { ...scene, elements: [...scene.elements, previewElement] }
      : scene,
  );
  const beginElementDrag = (
    event: React.PointerEvent<SVGElement>,
    element: CircuitElement,
    index: number,
  ) => {
    if (tool !== "select") return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setSelection({ kind: "element", index });
    elementDrag.current = {
      index,
      origin: element,
      start: pointFromEvent(event),
    };
  };
  const overlay = scene.elements.map((element, index) =>
    "from" in element ? (
      <line
        key={element.id}
        data-editor-element={element.id}
        x1={element.from[0]}
        y1={element.from[1]}
        x2={element.to[0]}
        y2={element.to[1]}
        stroke="transparent"
        strokeWidth="24"
        pointerEvents={tool === "select" ? "stroke" : "none"}
        className={
          tool === "select" ? "cursor-grab active:cursor-grabbing" : ""
        }
        onPointerDown={(event) => beginElementDrag(event, element, index)}
        onClick={(event) => {
          event.stopPropagation();
          setSelection({ kind: "element", index });
        }}
      />
    ) : element.type === "opAmp" ? (
      <rect
        key={element.id}
        data-editor-element={element.id}
        x={element.center[0] - element.width / 2}
        y={element.center[1] - element.height / 2}
        width={element.width}
        height={element.height}
        fill="transparent"
        pointerEvents={tool === "select" ? "all" : "none"}
        className={
          tool === "select" ? "cursor-grab active:cursor-grabbing" : ""
        }
        onPointerDown={(event) => beginElementDrag(event, element, index)}
        onClick={(event) => {
          event.stopPropagation();
          setSelection({ kind: "element", index });
        }}
      />
    ) : null,
  );
  const wirePreviewPoints =
    tool === "wire" &&
    wirePoints.length &&
    cursorPoint &&
    !samePoint(wirePoints[wirePoints.length - 1], cursorPoint)
      ? [...wirePoints, cursorPoint]
      : wirePoints;

  return (
    <section
      className="space-y-3"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setWirePoints([]);
          setCursorPoint(null);
          setTool("select");
        }
        if (event.key === "Enter" && tool === "wire") finishWire();
        if (event.key === "Delete" || event.key === "Backspace")
          removeSelected();
        if (event.key.startsWith("Arrow") && selection) event.preventDefault();
        if (event.key === "ArrowLeft") moveSelected(-GRID, 0);
        if (event.key === "ArrowRight") moveSelected(GRID, 0);
        if (event.key === "ArrowUp") moveSelected(0, -GRID);
        if (event.key === "ArrowDown") moveSelected(0, GRID);
      }}
    >
      <label className="block text-sm font-medium">
        Accessible circuit description
        <input
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
          value={scene.ariaLabel}
          onChange={(event) => update({ ariaLabel: event.target.value })}
          placeholder="Describe the circuit and its purpose"
        />
      </label>
      <div className="relative aspect-[2/1] overflow-hidden rounded-xl border border-border bg-surface-strong">
        <div className="pointer-events-none absolute inset-0">
          <CircuitSvg definition={scene} params={{}} />
        </div>
        {previewScene ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            data-testid="component-preview"
          >
            <CircuitSvg definition={previewScene} params={{}} />
          </div>
        ) : null}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          className={`absolute inset-0 h-full w-full touch-none ${tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
          onClick={handleClick}
          onDoubleClick={finishWire}
          onPointerDown={(event) => {
            if (tool !== "wire") return;
            const start = pointFromEvent(event);
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
            const point = pointFromEvent(event);
            setCursorPoint(point);
            const drag = elementDrag.current;
            if (drag) {
              const elements = [...scene.elements];
              elements[drag.index] = translateElement(
                drag.origin,
                point[0] - drag.start[0],
                point[1] - drag.start[1],
              );
              update({ elements });
            }
          }}
          onPointerUp={(event) => {
            elementDrag.current = null;
            const drag = wireDrag.current;
            wireDrag.current = null;
            if (!drag) return;
            const end = pointFromEvent(event);
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
            elementDrag.current = null;
            wireDrag.current = null;
          }}
          onPointerLeave={() => setCursorPoint(null)}
          aria-label="Circuit editing canvas"
        >
          <defs>
            <pattern
              id="circuit-editor-grid"
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
            fill="url(#circuit-editor-grid)"
            pointerEvents="none"
          />
          {overlay}
          {scene.wires.map((wire, index) => (
            <polyline
              key={index}
              points={wire.points.join(" ")}
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
          {(scene.annotations ?? []).map((annotation, index) =>
            annotation.type === "text" ? (
              <circle
                key={index}
                cx={annotation.at[0]}
                cy={annotation.at[1]}
                r="18"
                fill="transparent"
                pointerEvents={tool === "select" ? "all" : "none"}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelection({ kind: "annotation", index });
                }}
              />
            ) : null,
          )}
          {nodes.map(([x, y]) => {
            const active =
              tool === "wire" &&
              cursorPoint !== null &&
              samePoint([x, y], cursorPoint);
            return (
              <circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r={active ? 6 : 3.5}
                fill={
                  active
                    ? "var(--color-primary)"
                    : "var(--color-surface-strong)"
                }
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                pointerEvents="none"
                data-circuit-node={`${x},${y}`}
              />
            );
          })}
          {wirePoints.length ? (
            <>
              <polyline
                points={wirePreviewPoints.join(" ")}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeDasharray="8 5"
                pointerEvents="none"
              />
              {wirePoints.map(([x, y], index) => (
                <circle
                  key={`${x}-${y}-${index}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="var(--color-primary)"
                  pointerEvents="none"
                />
              ))}
            </>
          ) : null}
        </svg>
      </div>
      <div
        className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-2"
        aria-label="Circuit palette"
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
        Drag a component to move it, or use the arrow keys for one-grid nudges.
        With Wire selected, drag between terminals or click terminal endpoints
        to connect them.
      </p>
      {selection ? (
        <div className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2">
          {selectedElement ? (
            <>
              <label className="text-sm">
                Unique ID
                <input
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedElement.id}
                  onChange={(event) => {
                    const elements = [...scene.elements];
                    elements[selection!.index] = {
                      ...selectedElement,
                      id: event.target.value,
                    };
                    update({ elements });
                  }}
                />
              </label>
              <label className="text-sm">
                Display label
                <input
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={selectedElement.label ?? ""}
                  onChange={(event) => {
                    const elements = [...scene.elements];
                    elements[selection!.index] = {
                      ...selectedElement,
                      label: event.target.value,
                    };
                    update({ elements });
                  }}
                />
              </label>
              <label className="text-sm">
                Parameter binding
                <select
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                  value={binding}
                  onChange={(event) => {
                    const row = parameters.find(
                      (item) => item.name.trim() === event.target.value,
                    );
                    const elements = [...scene.elements];
                    elements[selection!.index] = {
                      ...selectedElement,
                      value: event.target.value
                        ? {
                            path: event.target.value,
                            sourceUnit: row?.unit || undefined,
                            significantDigits: 3,
                          }
                        : undefined,
                    };
                    update({ elements });
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
          {selectedText ? (
            <label className="text-sm">
              Label text
              <input
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1"
                value={selectedText.text}
                onChange={(event) => {
                  const annotations = [...(scene.annotations ?? [])];
                  annotations[selection!.index] = {
                    ...selectedText,
                    text: event.target.value,
                  };
                  update({ annotations });
                }}
              />
            </label>
          ) : null}
          <div className="flex items-end gap-2">
            {selectedElement ? (
              <button
                type="button"
                className="rounded bg-surface-muted px-3 py-2 text-sm"
                onClick={rotateSelected}
              >
                Rotate component
              </button>
            ) : null}
            <button
              type="button"
              className="rounded bg-red-700 px-3 py-2 text-sm text-white"
              onClick={removeSelected}
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
