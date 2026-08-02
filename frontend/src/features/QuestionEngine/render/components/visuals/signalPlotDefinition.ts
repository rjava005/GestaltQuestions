export type AxisDefinition = {
  min: number;
  max: number;
  label?: string;
  ticks?: number;
};
export type ParameterSeries = { path: string };
export type SignalTrace = {
  id: string;
  label?: string;
  kind: "continuous" | "piecewise" | "discrete" | "impulse";
  x?: number[];
  y?: number[];
  xBinding?: ParameterSeries;
  yBinding?: ParameterSeries;
  color?: string;
  visible?: boolean;
};
export type SignalMarker = {
  id: string;
  answerName: string;
  x: number;
  label?: string;
  draggable?: boolean;
};
export type SignalInterval = {
  id: string;
  answerName: string;
  start: number;
  end: number;
  label?: string;
  draggable?: boolean;
};
export type SignalPlotDefinition = {
  version: 1;
  ariaLabel: string;
  axes: { x: AxisDefinition; y: AxisDefinition };
  traces: SignalTrace[];
  shadedRegions?: {
    x1: number;
    x2: number;
    y1?: number;
    y2?: number;
    color?: string;
    label?: string;
  }[];
  markers?: SignalMarker[];
  intervals?: SignalInterval[];
  interactions?: {
    cursor?: boolean;
    zoomPan?: boolean;
    traceToggles?: boolean;
  };
};

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const numbers = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length <= 10_000 && value.every(finite);

export function validateSignalPlotDefinition(
  value: unknown,
): SignalPlotDefinition {
  if (!record(value) || value.version !== 1)
    throw new Error("Unsupported signal-plot definition version.");
  if (
    typeof value.ariaLabel !== "string" ||
    !record(value.axes) ||
    !record(value.axes.x) ||
    !record(value.axes.y)
  )
    throw new Error("Signal plot requires ariaLabel and x/y axes.");
  for (const [name, axis] of Object.entries(value.axes)) {
    if (
      !record(axis) ||
      !finite(axis.min) ||
      !finite(axis.max) ||
      axis.max <= axis.min
    )
      throw new Error(`Signal plot ${name} axis is invalid.`);
  }
  if (!Array.isArray(value.traces) || value.traces.length > 32)
    throw new Error("Signal plot requires at most 32 traces.");
  const ids = new Set<string>();
  for (const trace of value.traces) {
    if (
      !record(trace) ||
      typeof trace.id !== "string" ||
      ids.has(trace.id) ||
      !["continuous", "piecewise", "discrete", "impulse"].includes(
        String(trace.kind),
      )
    )
      throw new Error("Signal plot contains a malformed trace.");
    ids.add(trace.id);
    const bound =
      record(trace.xBinding) &&
      typeof trace.xBinding.path === "string" &&
      record(trace.yBinding) &&
      typeof trace.yBinding.path === "string";
    if (
      !bound &&
      (!numbers(trace.x) ||
        !numbers(trace.y) ||
        trace.x.length !== trace.y.length)
    )
      throw new Error(
        `Signal trace '${trace.id}' needs equal finite x/y data.`,
      );
  }
  for (const key of ["markers", "intervals", "shadedRegions"] as const)
    if (value[key] !== undefined && !Array.isArray(value[key]))
      throw new Error(`Signal plot ${key} must be an array.`);
  return value as unknown as SignalPlotDefinition;
}
