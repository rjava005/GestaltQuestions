import type { ReactNode } from "react";
import { useId } from "react";

import { useQuestionInstance } from "../../../instance";
import { formatCircuitValue } from "../content/circuitDefinition";
import StructuredMathInput from "../math/StructuredMathInput";
import {
  type BlockAnswerSlot,
  type BlockDiagramDefinition,
  type BlockNode,
  validateBlockDiagramDefinition,
} from "./blockDiagramDefinition";
import { useQuestionJsonAsset } from "./useQuestionAsset";

export type PLBlockDiagramProps = { fileName: string; className?: string };
const diagramText = "var(--color-text, currentColor)";
const embeddedAnswerStyle =
  "!min-h-0 h-full w-full border-2 border-[var(--color-accent)] bg-[var(--color-surface-strong)] !px-2 !py-0 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-surface-strong)]";
const embeddedMathAnswerStyle = `embedded-answer-math-field ${embeddedAnswerStyle}`;

function Node({
  node,
  params,
}: {
  node: BlockNode;
  params: Record<string, unknown>;
}) {
  const [x, y] = node.at,
    width =
      node.width ??
      (node.type === "sum" || node.type === "mixer" || node.type === "pickoff"
        ? 36
        : 110),
    height = node.height ?? 58;
  const value = formatCircuitValue(node.value, params);
  const label = value
    ? `${node.label ? `${node.label}\n` : ""}${value}`
    : node.label;
  if (node.type === "label")
    return (
      <text x={x} y={y} textAnchor="middle" fill={diagramText}>
        {label}
      </text>
    );
  if (node.type === "pickoff")
    return (
      <g data-block-node={node.id}>
        <circle cx={x} cy={y} r={5} fill="var(--color-accent, #2563eb)" />
        <text x={x + 9} y={y - 9} fill={diagramText}>
          {label}
        </text>
      </g>
    );
  if (node.type === "sum" || node.type === "mixer")
    return (
      <g data-block-node={node.id}>
        <circle
          cx={x}
          cy={y}
          r={width / 2}
          fill="var(--color-surface-strong, white)"
          stroke="var(--color-accent, #2563eb)"
          strokeWidth={2.5}
        />
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fontSize={18}
          fill={diagramText}
        >
          {node.type === "mixer" ? "×" : "Σ"}
        </text>
        {node.signs && (
          <text
            x={x - width / 2 - 10}
            y={y - width / 2 + 5}
            fontSize={13}
            fill={diagramText}
          >
            {node.signs}
          </text>
        )}
      </g>
    );
  if (node.type === "source" || node.type === "sink")
    return (
      <g data-block-node={node.id}>
        <path
          d={
            node.type === "source"
              ? `M${x - width / 2},${y - height / 2}H${x + width / 2 - 14}L${x + width / 2},${y}L${x + width / 2 - 14},${y + height / 2}H${x - width / 2}Z`
              : `M${x - width / 2},${y - height / 2}H${x + width / 2}V${y + height / 2}H${x - width / 2 + 14}L${x - width / 2},${y}Z`
          }
          fill="var(--color-surface-strong, white)"
          stroke="var(--color-accent, #2563eb)"
          strokeWidth={2.5}
        />
        <text x={x} y={y + 5} textAnchor="middle" fill={diagramText}>
          {label}
        </text>
      </g>
    );
  const symbol =
    node.type === "integrator"
      ? "1/s"
      : node.type === "delay"
        ? "z⁻¹"
        : node.type === "gain"
          ? (label ?? "K")
          : label;
  return (
    <g data-block-node={node.id}>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={node.type === "function" ? 14 : 3}
        fill="var(--color-surface-strong, white)"
        stroke="var(--color-accent, #2563eb)"
        strokeWidth={2.5}
      />
      <text
        x={x}
        y={y + (symbol?.includes("\n") ? -3 : 5)}
        textAnchor="middle"
        fill={diagramText}
      >
        {symbol?.split("\n").map((line, index) => (
          <tspan key={index} x={x} dy={index ? 18 : 0}>
            {line}
          </tspan>
        ))}
      </text>
      {node.ports?.map((port) => (
        <g key={port.id}>
          <circle cx={port.at[0]} cy={port.at[1]} r={3} />
          <text
            x={port.at[0]}
            y={port.at[1] - 7}
            textAnchor="middle"
            fontSize={11}
            fill={diagramText}
          >
            {port.label}
          </text>
        </g>
      ))}
    </g>
  );
}

/**
 * Absolute position of an answer slot as percentages of the viewBox, so the HTML
 * overlay lines up with the SVG underneath it. Shared by the student-facing scene
 * and the authoring editor so the two cannot drift apart.
 */
export function blockSlotBoxStyle(
  slot: BlockAnswerSlot,
  viewBox: BlockDiagramDefinition["viewBox"],
) {
  const [vx, vy, vw, vh] = viewBox;
  return {
    left: `${((slot.at[0] - slot.width / 2 - vx) / vw) * 100}%`,
    top: `${((slot.at[1] - slot.height / 2 - vy) / vh) * 100}%`,
    width: `${(slot.width / vw) * 100}%`,
    height: `${(slot.height / vh) * 100}%`,
  };
}

/**
 * The diagram itself: wires and nodes, with no answer state. Pure, so the authoring
 * editor can render it without a QuestionInstanceProvider. `children` is overlaid on
 * top of the SVG for answer slots -- live inputs in a question, inert boxes in the
 * editor.
 */
export function BlockDiagramGeometry({
  definition,
  params,
  children,
}: {
  definition: BlockDiagramDefinition;
  params: Record<string, unknown>;
  children?: ReactNode;
}) {
  const raw = useId(),
    arrowId = `block-arrow-${raw.replaceAll(":", "")}`;
  const [, , vw, vh] = definition.viewBox;
  return (
    <div className="relative w-full" style={{ aspectRatio: `${vw}/${vh}` }}>
      <svg
        viewBox={definition.viewBox.join(" ")}
        role="img"
        aria-label={definition.ariaLabel}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{definition.ariaLabel}</title>
        <desc>
          Explicitly positioned signal-flow block diagram with directed wires
          and answer fields.
        </desc>
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="var(--color-primary, #2563a6)" />
          </marker>
        </defs>
        {definition.wires.map((wire, index) => (
          <g key={wire.id ?? index}>
            <polyline
              data-feedback={wire.feedback || undefined}
              points={wire.points.map((point) => point.join(",")).join(" ")}
              fill="none"
              stroke={
                wire.feedback
                  ? "var(--color-warning, #d97706)"
                  : "var(--color-primary, #2563a6)"
              }
              strokeWidth={2.5}
              strokeLinejoin="round"
              markerEnd={`url(#${arrowId})`}
            />
            {wire.label && (
              <text
                x={(wire.points[0][0] + wire.points[1][0]) / 2}
                y={(wire.points[0][1] + wire.points[1][1]) / 2 - 8}
                textAnchor="middle"
                fontSize={13}
                fill={diagramText}
              >
                {wire.label}
              </text>
            )}
          </g>
        ))}
        {definition.nodes.map((node) => (
          <Node key={node.id} node={node} params={params} />
        ))}
      </svg>
      {children}
    </div>
  );
}

export function BlockDiagramScene({
  definition,
  params,
}: {
  definition: BlockDiagramDefinition;
  params: Record<string, unknown>;
}) {
  const answers = useQuestionInstance((state) => state.answers),
    setAnswer = useQuestionInstance((state) => state.setAnswer),
    submitted = useQuestionInstance((state) => state.hasSubmitted);
  return (
    <BlockDiagramGeometry definition={definition} params={params}>
      {definition.answerSlots?.map((slot) => (
        <div
          key={slot.id}
          data-block-answer={slot.answerName}
          className="absolute flex flex-col gap-1 rounded-md border-2 border-[var(--color-accent)] bg-[var(--color-surface-strong)] p-1.5 text-[var(--color-text)] shadow-sm"
          style={blockSlotBoxStyle(slot, definition.viewBox)}
        >
          <div
            className="shrink-0 truncate text-center text-xs font-semibold leading-none text-[var(--color-accent)]"
            title={slot.label ?? slot.answerName}
          >
            {slot.label ?? slot.answerName}
          </div>
          {slot.kind === "math" ? (
            <div className="min-h-0 flex-1">
              <StructuredMathInput
                answerName={slot.answerName}
                label={slot.label ?? slot.answerName}
                compact
                className="h-full"
                fieldClassName={embeddedMathAnswerStyle}
              />
            </div>
          ) : (
            <label className="min-h-0 flex-1">
              <span className="sr-only">{slot.label ?? slot.answerName}</span>
              <input
                type="number"
                inputMode="decimal"
                disabled={submitted}
                value={
                  typeof answers[slot.answerName] === "string" ||
                  typeof answers[slot.answerName] === "number"
                    ? String(answers[slot.answerName])
                    : ""
                }
                onChange={(event) =>
                  setAnswer(slot.answerName, event.target.value)
                }
                className={`rounded text-center ${embeddedAnswerStyle}`}
              />
            </label>
          )}
        </div>
      ))}
    </BlockDiagramGeometry>
  );
}

export default function PLBlockDiagram({
  fileName,
  className = "",
}: PLBlockDiagramProps) {
  const params = useQuestionInstance((state) => state.quiz_data?.params ?? {});
  const state = useQuestionJsonAsset(fileName, validateBlockDiagramDefinition);
  return (
    <div
      className={`my-4 overflow-visible rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 ${className}`}
    >
      {state.status === "loading" ? (
        <div role="status">Loading block diagram…</div>
      ) : state.status === "error" ? (
        <div role="alert" className="text-red-700">
          Unable to display block diagram: {state.message}
        </div>
      ) : (
        <BlockDiagramScene
          definition={state.value}
          params={params as Record<string, unknown>}
        />
      )}
    </div>
  );
}
