/* global SVGSVGElement */

import {
  type PointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { useQuestionInstance } from "../../../instance";
import { lookupParameter } from "../content/circuitDefinition";
import {
  type AxisDefinition,
  type SignalPlotDefinition,
  type SignalTrace,
  validateSignalPlotDefinition,
} from "./signalPlotDefinition";
import { useQuestionJsonAsset } from "./useQuestionAsset";

export type PLSignalPlotProps = { fileName: string; className?: string };
const WIDTH = 800,
  HEIGHT = 420,
  LEFT = 70,
  RIGHT = 24,
  TOP = 28,
  BOTTOM = 60;
const colors = ["#2563eb", "#dc2626", "#059669", "#9333ea", "#ea580c"];

function resolveTrace(
  trace: SignalTrace,
  params: Record<string, unknown>,
): { x: number[]; y: number[] } {
  const x =
    trace.x ??
    (trace.xBinding ? lookupParameter(params, trace.xBinding.path) : undefined);
  const y =
    trace.y ??
    (trace.yBinding ? lookupParameter(params, trace.yBinding.path) : undefined);
  if (
    !Array.isArray(x) ||
    !Array.isArray(y) ||
    x.length !== y.length ||
    x.length > 10_000 ||
    !x.every(Number.isFinite) ||
    !y.every(Number.isFinite)
  )
    throw new Error(`Trace '${trace.id}' resolved to invalid data.`);
  return { x: x as number[], y: y as number[] };
}

function ticks(axis: AxisDefinition): number[] {
  const count = Math.max(2, Math.min(axis.ticks ?? 6, 12));
  return Array.from(
    { length: count + 1 },
    (_, index) => axis.min + (index * (axis.max - axis.min)) / count,
  );
}

export function SignalPlotSvg({
  definition,
  params,
}: {
  definition: SignalPlotDefinition;
  params: Record<string, unknown>;
}) {
  const answers = useQuestionInstance((state) => state.answers);
  const setAnswer = useQuestionInstance((state) => state.setAnswer);
  const [xAxis, setXAxis] = useState(definition.axes.x);
  const [hidden, setHidden] = useState<Set<string>>(
    () =>
      new Set(
        definition.traces
          .filter((trace) => trace.visible === false)
          .map((trace) => trace.id),
      ),
  );
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ answerName: string; intervalIndex?: number } | null>(
    null,
  );
  const pan = useRef<{ clientX: number; min: number; max: number } | null>(
    null,
  );
  const xMap = useCallback(
    (x: number) =>
      LEFT +
      ((x - xAxis.min) / (xAxis.max - xAxis.min)) * (WIDTH - LEFT - RIGHT),
    [xAxis],
  );
  const yMap = useCallback(
    (y: number) =>
      TOP +
      ((definition.axes.y.max - y) /
        (definition.axes.y.max - definition.axes.y.min)) *
        (HEIGHT - TOP - BOTTOM),
    [definition.axes.y],
  );
  const fromClientX = (clientX: number, target: SVGSVGElement) =>
    xAxis.min +
    ((((clientX - target.getBoundingClientRect().left) /
      target.getBoundingClientRect().width) *
      WIDTH -
      LEFT) *
      (xAxis.max - xAxis.min)) /
      (WIDTH - LEFT - RIGHT);
  const resolved = useMemo(
    () =>
      definition.traces.map((trace) => ({
        trace,
        data: resolveTrace(trace, params),
      })),
    [definition.traces, params],
  );

  const move = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * WIDTH,
      sy = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    if (drag.current) {
      const value = Math.max(
        xAxis.min,
        Math.min(xAxis.max, fromClientX(event.clientX, event.currentTarget)),
      );
      if (drag.current.intervalIndex === undefined)
        setAnswer(drag.current.answerName, Number(value.toPrecision(8)));
      else {
        const existing = answers[drag.current.answerName];
        const values = Array.isArray(existing) ? [...existing] : ["0", "0"];
        values[drag.current.intervalIndex] = String(
          Number(value.toPrecision(8)),
        );
        setAnswer(drag.current.answerName, values);
      }
    } else if (pan.current) {
      const shift =
        ((event.clientX - pan.current.clientX) / rect.width) *
        (pan.current.max - pan.current.min);
      setXAxis({
        ...xAxis,
        min: pan.current.min - shift,
        max: pan.current.max - shift,
      });
    }
    if (
      definition.interactions?.cursor &&
      sx >= LEFT &&
      sx <= WIDTH - RIGHT &&
      sy >= TOP &&
      sy <= HEIGHT - BOTTOM
    )
      setCursor({
        x: fromClientX(event.clientX, event.currentTarget),
        y:
          definition.axes.y.max -
          ((sy - TOP) / (HEIGHT - TOP - BOTTOM)) *
            (definition.axes.y.max - definition.axes.y.min),
      });
  };
  const end = () => {
    drag.current = null;
    pan.current = null;
  };
  return (
    <div>
      {definition.interactions?.traceToggles && (
        <div className="flex flex-wrap gap-2 p-2" aria-label="Trace visibility">
          {definition.traces.map((trace, index) => (
            <button
              type="button"
              key={trace.id}
              aria-pressed={!hidden.has(trace.id)}
              onClick={() =>
                setHidden((current) => {
                  const next = new Set(current);
                  next.has(trace.id)
                    ? next.delete(trace.id)
                    : next.add(trace.id);
                  return next;
                })
              }
              className="rounded border px-2 py-1 text-xs"
            >
              <span
                style={{ color: trace.color ?? colors[index % colors.length] }}
              >
                ●
              </span>{" "}
              {trace.label ?? trace.id}
            </button>
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={definition.ariaLabel}
        className="block h-auto w-full touch-none select-none"
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={() => {
          end();
          setCursor(null);
        }}
        onPointerDown={(event) => {
          if (definition.interactions?.zoomPan) {
            event.currentTarget.setPointerCapture(event.pointerId);
            pan.current = {
              clientX: event.clientX,
              min: xAxis.min,
              max: xAxis.max,
            };
          }
        }}
        onWheel={(event) => {
          if (!definition.interactions?.zoomPan) return;
          event.preventDefault();
          const center = fromClientX(event.clientX, event.currentTarget);
          const scale = event.deltaY > 0 ? 1.15 : 0.85;
          setXAxis({
            ...xAxis,
            min: center + (xAxis.min - center) * scale,
            max: center + (xAxis.max - center) * scale,
          });
        }}
      >
        <title>{definition.ariaLabel}</title>
        <desc>
          Interactive signal plot. Use trace buttons to toggle data and pointer
          controls to inspect or move authored markers.
        </desc>
        <rect
          x={LEFT}
          y={TOP}
          width={WIDTH - LEFT - RIGHT}
          height={HEIGHT - TOP - BOTTOM}
          fill="var(--color-surface-strong, white)"
          stroke="var(--color-border, #bbb)"
        />
        {definition.shadedRegions?.map((region, index) => (
          <g key={index}>
            <rect
              x={xMap(region.x1)}
              y={yMap(region.y2 ?? definition.axes.y.max)}
              width={xMap(region.x2) - xMap(region.x1)}
              height={
                yMap(region.y1 ?? definition.axes.y.min) -
                yMap(region.y2 ?? definition.axes.y.max)
              }
              fill={region.color ?? "#93c5fd"}
              opacity={0.28}
            />
            {region.label && (
              <text
                x={xMap((region.x1 + region.x2) / 2)}
                y={TOP + 18}
                textAnchor="middle"
                fontSize={12}
              >
                {region.label}
              </text>
            )}
          </g>
        ))}
        {ticks(xAxis).map((value) => (
          <g key={`x${value}`}>
            <line
              x1={xMap(value)}
              y1={TOP}
              x2={xMap(value)}
              y2={HEIGHT - BOTTOM}
              stroke="#94a3b8"
              opacity={0.2}
            />
            <text
              x={xMap(value)}
              y={HEIGHT - BOTTOM + 22}
              textAnchor="middle"
              fontSize={12}
            >
              {Number(value.toPrecision(4))}
            </text>
          </g>
        ))}
        {ticks(definition.axes.y).map((value) => (
          <g key={`y${value}`}>
            <line
              x1={LEFT}
              y1={yMap(value)}
              x2={WIDTH - RIGHT}
              y2={yMap(value)}
              stroke="#94a3b8"
              opacity={0.2}
            />
            <text
              x={LEFT - 10}
              y={yMap(value) + 4}
              textAnchor="end"
              fontSize={12}
            >
              {Number(value.toPrecision(4))}
            </text>
          </g>
        ))}
        <text
          x={(LEFT + WIDTH - RIGHT) / 2}
          y={HEIGHT - 12}
          textAnchor="middle"
        >
          {xAxis.label}
        </text>
        <text
          transform={`translate(18 ${(TOP + HEIGHT - BOTTOM) / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {definition.axes.y.label}
        </text>
        <defs>
          <marker
            id="signal-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        {resolved.map(({ trace, data }, index) => {
          if (hidden.has(trace.id)) return null;
          const color = trace.color ?? colors[index % colors.length];
          if (trace.kind === "continuous" || trace.kind === "piecewise")
            return (
              <polyline
                key={trace.id}
                data-trace={trace.id}
                points={data.x
                  .map((x, point) => `${xMap(x)},${yMap(data.y[point])}`)
                  .join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
              />
            );
          return (
            <g key={trace.id} data-trace={trace.id} stroke={color} fill={color}>
              {data.x.map((x, point) =>
                trace.kind === "impulse" ? (
                  <line
                    key={point}
                    x1={xMap(x)}
                    y1={yMap(0)}
                    x2={xMap(x)}
                    y2={yMap(data.y[point])}
                    strokeWidth={2.2}
                    markerEnd="url(#signal-arrow)"
                  />
                ) : (
                  <g key={point}>
                    <line
                      x1={xMap(x)}
                      y1={yMap(0)}
                      x2={xMap(x)}
                      y2={yMap(data.y[point])}
                      strokeWidth={2}
                    />
                    <circle cx={xMap(x)} cy={yMap(data.y[point])} r={4} />
                  </g>
                ),
              )}
            </g>
          );
        })}
        {definition.markers?.map((marker) => {
          const answer = answers[marker.answerName],
            value = typeof answer === "number" ? answer : marker.x;
          return (
            <g
              key={marker.id}
              role="slider"
              aria-label={marker.label ?? marker.id}
              aria-valuemin={xAxis.min}
              aria-valuemax={xAxis.max}
              aria-valuenow={value}
              tabIndex={marker.draggable ? 0 : undefined}
              onPointerDown={(event) => {
                if (marker.draggable) {
                  event.stopPropagation();
                  drag.current = { answerName: marker.answerName };
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setAnswer(marker.answerName, value);
                }
              }}
            >
              <line
                x1={xMap(value)}
                y1={TOP}
                x2={xMap(value)}
                y2={HEIGHT - BOTTOM}
                stroke="#e11d48"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              <circle cx={xMap(value)} cy={TOP + 10} r={7} fill="#e11d48" />
              <text x={xMap(value) + 9} y={TOP + 15} fontSize={12}>
                {marker.label}
              </text>
            </g>
          );
        })}
        {definition.intervals?.map((interval) => {
          const answer = answers[interval.answerName],
            values = Array.isArray(answer)
              ? answer.map(Number)
              : [interval.start, interval.end];
          return (
            <g key={interval.id}>
              <rect
                x={xMap(values[0])}
                y={TOP}
                width={xMap(values[1]) - xMap(values[0])}
                height={HEIGHT - TOP - BOTTOM}
                fill="#fbbf24"
                opacity={0.18}
              />
              {values.map((value, endpoint) => (
                <line
                  key={endpoint}
                  x1={xMap(value)}
                  y1={TOP}
                  x2={xMap(value)}
                  y2={HEIGHT - BOTTOM}
                  stroke="#d97706"
                  strokeWidth={3}
                  role="slider"
                  aria-label={`${interval.label ?? interval.id} ${endpoint ? "end" : "start"}`}
                  onPointerDown={(event) => {
                    if (interval.draggable) {
                      event.stopPropagation();
                      drag.current = {
                        answerName: interval.answerName,
                        intervalIndex: endpoint,
                      };
                      setAnswer(interval.answerName, values.map(String));
                    }
                  }}
                />
              ))}
            </g>
          );
        })}
        {cursor && (
          <g pointerEvents="none">
            <line
              x1={xMap(cursor.x)}
              y1={TOP}
              x2={xMap(cursor.x)}
              y2={HEIGHT - BOTTOM}
              stroke="#475569"
              strokeDasharray="3 3"
            />
            <text
              x={Math.min(xMap(cursor.x) + 8, WIDTH - 145)}
              y={TOP + 18}
              fontSize={12}
            >{`x=${cursor.x.toPrecision(4)}, y=${cursor.y.toPrecision(4)}`}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function PLSignalPlot({
  fileName,
  className = "",
}: PLSignalPlotProps) {
  const params = useQuestionInstance((state) => state.quiz_data?.params ?? {});
  const state = useQuestionJsonAsset(fileName, validateSignalPlotDefinition);
  return (
    <div
      className={`my-4 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] ${className}`}
    >
      {state.status === "loading" ? (
        <div role="status" className="p-4">
          Loading signal plot…
        </div>
      ) : state.status === "error" ? (
        <div role="alert" className="p-4 text-red-700">
          Unable to display signal plot: {state.message}
        </div>
      ) : (
        <SignalPlotSvg
          definition={state.value}
          params={params as Record<string, unknown>}
        />
      )}
    </div>
  );
}
