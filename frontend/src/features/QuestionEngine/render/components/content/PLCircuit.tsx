import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useId, useMemo, useState } from "react";

import { questionAPIURL } from "../../../../../config/apiConfig";
import { firebase } from "../../../../../config/firebaseClient";
import { useQuestionInstance } from "../../../instance";
import {
  type CircuitAnnotation,
  type CircuitDefinition,
  type CircuitElement,
  type CircuitLabel,
  type CircuitPoint,
  type CircuitScene,
  formatCircuitValue,
  getOpAmpTerminalStubs,
  selectCircuitScene,
  validateCircuitDefinition,
} from "./circuitDefinition";

export interface PLCircuitProps {
  fileName: string;
  className?: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; definition: CircuitDefinition }
  | { status: "error"; message: string };

const wireColor = "var(--color-primary, #2563a6)";
const passiveColor = "var(--color-success, #15965f)";
const activeColor = "var(--color-warning, #e67e22)";
const textColor = "var(--color-text, currentColor)";

function toAssetUrl(qid: string, fileName: string): string {
  const encodedPath = fileName.split("/").map(encodeURIComponent).join("/");
  return `${questionAPIURL}/questions/${encodeURIComponent(qid)}/runtimes/assets/${encodedPath}`;
}

function Label({
  label,
  value,
  position,
}: {
  label?: string;
  value?: string;
  position?: CircuitLabel;
}) {
  if ((!label && !value) || !position) return null;
  return (
    <text
      x={position.at[0]}
      y={position.at[1]}
      textAnchor={position.anchor ?? "middle"}
      fill={textColor}
      className="select-none text-[15px]"
    >
      {label ? <tspan x={position.at[0]}>{label}</tspan> : null}
      {value ? (
        <tspan x={position.at[0]} dy={label ? 18 : 0}>
          {value}
        </tspan>
      ) : null}
    </text>
  );
}

function transformBetween(from: CircuitPoint, to: CircuitPoint) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    length,
    transform: `translate(${from[0]} ${from[1]}) rotate(${angle})`,
  };
}

function TwoTerminalSymbol({ element }: { element: CircuitElement }) {
  if (!("from" in element)) return null;
  const { length, transform } = transformBetween(element.from, element.to);
  const lead = Math.min(18, length * 0.2);
  const bodyLength = length - lead * 2;
  const common = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.5,
  };

  if (element.type === "resistor") {
    const points: CircuitPoint[] = [
      [0, 0],
      [lead, 0],
    ];
    const teeth = 8;
    for (let index = 0; index <= teeth; index += 1) {
      points.push([
        lead + (bodyLength * index) / teeth,
        index === 0 || index === teeth ? 0 : index % 2 ? -8 : 8,
      ]);
    }
    points.push([length, 0]);
    return (
      <polyline
        points={points.map((point) => point.join(",")).join(" ")}
        transform={transform}
        stroke={passiveColor}
        {...common}
      />
    );
  }
  if (element.type === "capacitor") {
    const middle = length / 2;
    return (
      <g transform={transform} stroke={passiveColor} {...common}>
        <line x1={0} y1={0} x2={middle - 5} y2={0} />
        <line x1={middle - 5} y1={-13} x2={middle - 5} y2={13} />
        <line x1={middle + 5} y1={-13} x2={middle + 5} y2={13} />
        <line x1={middle + 5} y1={0} x2={length} y2={0} />
      </g>
    );
  }
  if (element.type === "inductor") {
    const coils = 4;
    const coilWidth = bodyLength / coils;
    let path = `M 0 0 H ${lead}`;
    for (let index = 0; index < coils; index += 1) {
      const start = lead + index * coilWidth;
      path += ` C ${start + coilWidth * 0.2} -15 ${start + coilWidth * 0.8} -15 ${start + coilWidth} 0`;
    }
    path += ` H ${length}`;
    return (
      <path d={path} transform={transform} stroke={passiveColor} {...common} />
    );
  }
  if (element.type === "voltageSource") {
    const radius = Math.min(20, length * 0.25);
    const centerX = (element.from[0] + element.to[0]) / 2;
    const centerY = (element.from[1] + element.to[1]) / 2;
    const ux = (element.to[0] - element.from[0]) / length;
    const uy = (element.to[1] - element.from[1]) / length;
    const plusX = centerX + ux * 8;
    const plusY = centerY + uy * 8;
    const minusX = centerX - ux * 8;
    const minusY = centerY - uy * 8;
    return (
      <g stroke={activeColor} {...common}>
        <line
          x1={element.from[0]}
          y1={element.from[1]}
          x2={centerX - ux * radius}
          y2={centerY - uy * radius}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="var(--color-surface-strong, white)"
        />
        <line x1={plusX - 5} y1={plusY} x2={plusX + 5} y2={plusY} />
        <line x1={plusX} y1={plusY - 5} x2={plusX} y2={plusY + 5} />
        <line x1={minusX - 5} y1={minusY} x2={minusX + 5} y2={minusY} />
        <line
          x1={centerX + ux * radius}
          y1={centerY + uy * radius}
          x2={element.to[0]}
          y2={element.to[1]}
        />
      </g>
    );
  }
  return null;
}

function OpAmp({
  element,
}: {
  element: Extract<CircuitElement, { type: "opAmp" }>;
}) {
  const [cx, cy] = element.center;
  const halfWidth = element.width / 2;
  const halfHeight = element.height / 2;
  const right = element.direction !== "left";
  const tipX = right ? cx + halfWidth : cx - halfWidth;
  const baseX = right ? cx - halfWidth : cx + halfWidth;
  const signX = right ? baseX + 14 : baseX - 14;
  const terminalStubs = getOpAmpTerminalStubs(element);
  return (
    <g
      fill="var(--color-surface-strong, white)"
      stroke={activeColor}
      strokeWidth={2.5}
      strokeLinejoin="round"
    >
      {terminalStubs.map((stub, index) => (
        <line
          key={index}
          x1={stub.terminal[0]}
          y1={stub.terminal[1]}
          x2={stub.symbol[0]}
          y2={stub.symbol[1]}
        />
      ))}
      <path
        d={`M ${baseX} ${cy - halfHeight} L ${baseX} ${cy + halfHeight} L ${tipX} ${cy} Z`}
      />
      <text
        x={signX}
        y={cy - halfHeight / 2 + 5}
        fill={activeColor}
        stroke="none"
        textAnchor="middle"
        fontSize={18}
      >
        +
      </text>
      <text
        x={signX}
        y={cy + halfHeight / 2 + 5}
        fill={activeColor}
        stroke="none"
        textAnchor="middle"
        fontSize={18}
      >
        −
      </text>
    </g>
  );
}

function Ground({
  element,
}: {
  element: { at: CircuitPoint; direction?: "down" | "up" };
}) {
  const [x, y] = element.at;
  const scale = element.direction === "up" ? -1 : 1;
  return (
    <g
      transform={`translate(${x} ${y}) scale(1 ${scale})`}
      stroke={passiveColor}
      strokeWidth={2}
    >
      <line x1={0} y1={0} x2={0} y2={8} />
      <line x1={-14} y1={8} x2={14} y2={8} />
      <line x1={-9} y1={13} x2={9} y2={13} />
      <line x1={-4} y1={18} x2={4} y2={18} />
    </g>
  );
}

function Annotation({
  annotation,
  params,
  arrowId,
}: {
  annotation: CircuitAnnotation;
  params: Record<string, unknown>;
  arrowId: string;
}) {
  if (annotation.type === "node") {
    return (
      <circle
        cx={annotation.at[0]}
        cy={annotation.at[1]}
        r={4}
        fill={wireColor}
      />
    );
  }
  if (annotation.type === "currentArrow") {
    return (
      <g>
        <line
          x1={annotation.from[0]}
          y1={annotation.from[1]}
          x2={annotation.to[0]}
          y2={annotation.to[1]}
          stroke={activeColor}
          strokeWidth={2.5}
          markerEnd={`url(#${arrowId})`}
        />
        <Label label={annotation.label} position={annotation.labelPosition} />
      </g>
    );
  }
  if (annotation.type === "polarity") {
    return (
      <g fill={textColor} fontSize={18}>
        <text x={annotation.plus[0]} y={annotation.plus[1]} textAnchor="middle">
          +
        </text>
        <text
          x={annotation.minus[0]}
          y={annotation.minus[1]}
          textAnchor="middle"
        >
          −
        </text>
        <Label label={annotation.label} position={annotation.labelPosition} />
      </g>
    );
  }
  return (
    <Label
      label={annotation.text}
      value={formatCircuitValue(annotation.value, params)}
      position={{ at: annotation.at, anchor: annotation.anchor }}
    />
  );
}

export function CircuitSvg({
  definition,
  params,
}: {
  definition: CircuitScene;
  params: Record<string, unknown>;
}) {
  const rawId = useId();
  const arrowId = `circuit-arrow-${rawId.replaceAll(":", "")}`;
  const descriptions = definition.elements.flatMap((element) => {
    const value = formatCircuitValue(element.value, params);
    return element.label && value ? [`${element.label}: ${value}`] : [];
  });
  const description = descriptions.length
    ? `${definition.ariaLabel}. Current values: ${descriptions.join("; ")}.`
    : definition.ariaLabel;

  return (
    <svg
      viewBox={definition.viewBox.join(" ")}
      role="img"
      aria-label={definition.ariaLabel}
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full max-w-full"
    >
      <title>{definition.ariaLabel}</title>
      <desc>{description}</desc>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={activeColor} />
        </marker>
      </defs>
      <g
        fill="none"
        stroke={wireColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {definition.wires.map((wire, index) => (
          <polyline
            key={index}
            points={wire.points.map((point) => point.join(",")).join(" ")}
          />
        ))}
      </g>
      {definition.elements.map((element) => {
        const value = formatCircuitValue(element.value, params);
        return (
          <g key={element.id} data-circuit-element={element.id}>
            {"from" in element ? <TwoTerminalSymbol element={element} /> : null}
            {element.type === "opAmp" ? <OpAmp element={element} /> : null}
            {element.type === "ground" ? <Ground element={element} /> : null}
            {element.type === "terminal" ? (
              <circle
                cx={element.at[0]}
                cy={element.at[1]}
                r={5}
                fill="var(--color-surface-strong, white)"
                stroke={activeColor}
                strokeWidth={2}
              />
            ) : null}
            <Label
              label={element.label}
              value={value}
              position={element.labelPosition}
            />
          </g>
        );
      })}
      {definition.annotations?.map((annotation, index) => (
        <Annotation
          key={index}
          annotation={annotation}
          params={params}
          arrowId={arrowId}
        />
      ))}
    </svg>
  );
}

export default function PLCircuit({
  fileName,
  className = "",
}: PLCircuitProps) {
  const qmeta = useQuestionInstance((state) => state.qmeta);
  const params = useQuestionInstance((state) => state.quiz_data?.params ?? {});
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setLoadState({ status: "loading" });

    const load = async () => {
      try {
        if (!fileName) throw new Error("No circuit file was specified.");
        let url = fileName;
        if (qmeta?.storage_type === "local" && qmeta.id) {
          url = toAssetUrl(qmeta.id, fileName);
        } else if (qmeta?.storage_path) {
          const fullPath = `${qmeta.storage_path.replace(/\/+$/, "")}/${fileName}`;
          url = await getDownloadURL(ref(getStorage(firebase), fullPath));
        }
        const response = await globalThis.fetch(url);
        if (!response.ok) {
          throw new Error(`Could not load ${fileName} (${response.status}).`);
        }
        const definition = validateCircuitDefinition(await response.json());
        if (!cancelled) setLoadState({ status: "ready", definition });
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [fileName, qmeta?.id, qmeta?.storage_path, qmeta?.storage_type]);

  const content = useMemo(() => {
    if (loadState.status === "loading") {
      return (
        <div
          role="status"
          aria-live="polite"
          className="p-4 text-sm text-[var(--color-text-muted)]"
        >
          Loading circuit…
        </div>
      );
    }
    if (loadState.status === "error") {
      return (
        <div role="alert" className="p-4 text-sm text-red-700">
          Unable to display circuit: {loadState.message}
        </div>
      );
    }
    try {
      const scene = selectCircuitScene(
        loadState.definition,
        params as Record<string, unknown>,
      );
      return (
        <CircuitSvg
          definition={scene}
          params={params as Record<string, unknown>}
        />
      );
    } catch (error) {
      return (
        <div role="alert" className="p-4 text-sm text-red-700">
          Unable to display circuit:{" "}
          {error instanceof Error ? error.message : String(error)}
        </div>
      );
    }
  }, [loadState, params]);

  return (
    <div
      className={`my-4 flex w-full justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] ${className}`.trim()}
    >
      <div className="w-full max-w-[800px] p-3">{content}</div>
    </div>
  );
}
