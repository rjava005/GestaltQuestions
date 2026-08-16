import type { CircuitValue } from "../content/circuitDefinition";

export type BlockPoint = [number, number];
export type BlockPort = { id: string; at: BlockPoint; label?: string };
export type BlockNode = {
  id: string;
  type:
    | "transfer"
    | "function"
    | "gain"
    | "sum"
    | "mixer"
    | "pickoff"
    | "source"
    | "sink"
    | "integrator"
    | "delay"
    | "label";
  at: BlockPoint;
  width?: number;
  height?: number;
  label?: string;
  value?: CircuitValue;
  signs?: string;
  ports?: BlockPort[];
};
export type BlockWire = {
  id?: string;
  points: BlockPoint[];
  label?: string;
  feedback?: boolean;
};
export type BlockAnswerSlot = {
  id: string;
  answerName: string;
  at: BlockPoint;
  width: number;
  height: number;
  kind: "numeric" | "math";
  label?: string;
};
export type BlockDiagramDefinition = {
  version: 1;
  ariaLabel: string;
  viewBox: [number, number, number, number];
  nodes: BlockNode[];
  wires: BlockWire[];
  answerSlots?: BlockAnswerSlot[];
};

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const point = (value: unknown): value is BlockPoint =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((item) => typeof item === "number" && Number.isFinite(item));
const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const nodeTypes = new Set([
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
]);

export function validateBlockDiagramDefinition(
  value: unknown,
): BlockDiagramDefinition {
  if (!record(value) || value.version !== 1)
    throw new Error("Unsupported block-diagram definition version.");
  if (
    typeof value.ariaLabel !== "string" ||
    !Array.isArray(value.viewBox) ||
    value.viewBox.length !== 4 ||
    !value.viewBox.every(
      (item) => typeof item === "number" && Number.isFinite(item),
    ) ||
    !positive(value.viewBox[2]) ||
    !positive(value.viewBox[3])
  )
    throw new Error("Block diagram requires an ariaLabel and valid viewBox.");
  if (
    !Array.isArray(value.nodes) ||
    value.nodes.length > 128 ||
    !Array.isArray(value.wires) ||
    value.wires.length > 256
  )
    throw new Error("Block diagram node or wire limit exceeded.");
  const ids = new Set<string>();
  for (const node of value.nodes) {
    if (
      !record(node) ||
      typeof node.id !== "string" ||
      ids.has(node.id) ||
      !nodeTypes.has(String(node.type)) ||
      !point(node.at)
    )
      throw new Error("Block diagram contains a malformed node.");
    ids.add(node.id);
  }
  for (const wire of value.wires)
    if (
      !record(wire) ||
      !Array.isArray(wire.points) ||
      wire.points.length < 2 ||
      wire.points.length > 32 ||
      !wire.points.every(point)
    )
      throw new Error("Block diagram contains a malformed wire.");
  if (value.answerSlots !== undefined) {
    if (!Array.isArray(value.answerSlots) || value.answerSlots.length > 32)
      throw new Error("Block diagram answer-slot limit exceeded.");
    for (const slot of value.answerSlots)
      if (
        !record(slot) ||
        typeof slot.id !== "string" ||
        typeof slot.answerName !== "string" ||
        !point(slot.at) ||
        !positive(slot.width) ||
        !positive(slot.height) ||
        !["numeric", "math"].includes(String(slot.kind))
      )
        throw new Error("Block diagram contains a malformed answer slot.");
  }
  return value as unknown as BlockDiagramDefinition;
}
