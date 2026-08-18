import "mathlive";

import { ComputeEngine } from "@cortex-js/compute-engine";
import clsx from "clsx";
import type { MathfieldElement } from "mathlive";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AnswerSpec,
  StructuredMathAnswer,
} from "../../../../../services/QuestionRuntime/types";
import { useQuestionInstance } from "../../../instance";

type PaletteKey = "basic" | "signals" | "calculus" | "control";
type PaletteItem = { label: string; insert: string; operator?: string };

const PALETTES: Record<PaletteKey, PaletteItem[]> = {
  basic: [
    { label: "a/b", insert: "\\frac{#0}{#?}", operator: "Divide" },
    { label: "xⁿ", insert: "#0^{#?}", operator: "Power" },
    { label: "√x", insert: "\\sqrt{#0}", operator: "Sqrt" },
    { label: "( )", insert: "\\left(#0\\right)" },
    { label: "|x|", insert: "\\left|#0\\right|", operator: "Abs" },
  ],
  signals: [
    { label: "t", insert: "t" },
    { label: "n", insert: "n" },
    { label: "ω", insert: "\\omega" },
    { label: "π", insert: "\\pi" },
    { label: "j", insert: "j" },
    { label: "u(t)", insert: "u(t)" },
    { label: "δ(t)", insert: "\\delta(t)" },
  ],
  calculus: [
    { label: "∫", insert: "\\int_{#?}^{#?}#0\\,d#?", operator: "Integrate" },
    { label: "d/dt", insert: "\\frac{d}{dt}#0", operator: "Derivative" },
    {
      label: "∂/∂x",
      insert: "\\frac{\\partial}{\\partial x}#0",
      operator: "PartialDerivative",
    },
    { label: "lim", insert: "\\lim_{#?\\to#?}#0", operator: "Limit" },
    { label: "Σ", insert: "\\sum_{#?}^{#?}#0", operator: "Sum" },
  ],
  control: [
    { label: "s", insert: "s" },
    { label: "z", insert: "z" },
    { label: "G(s)", insert: "G(s)" },
    { label: "H(s)", insert: "H(s)" },
    { label: "K/(s+a)", insert: "\\frac{K}{s+a}", operator: "Divide" },
    {
      label: "ωₙ²/(…)",
      insert: "\\frac{\\omega_n^2}{s^2+2\\zeta\\omega_ns+\\omega_n^2}",
      operator: "Divide",
    },
  ],
};

type JsonExpression = unknown;

export function normalizeComputeMathJson(
  value: JsonExpression,
): JsonExpression {
  if (!Array.isArray(value)) {
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          normalizeComputeMathJson(child),
        ]),
      );
    return value;
  }
  const normalized = value.map(normalizeComputeMathJson);
  const [operator, ...args] = normalized;
  if (operator === "D") return ["Derivative", ...args];
  if (
    operator === "Limit" &&
    Array.isArray(args[0]) &&
    args[0][0] === "Function"
  ) {
    const fn = args[0],
      body = Array.isArray(fn[1]) && fn[1][0] === "Block" ? fn[1][1] : fn[1];
    return ["Limit", body, fn[2], args[1]];
  }
  if (
    operator === "Multiply" &&
    args.length === 2 &&
    Array.isArray(args[0]) &&
    args[0][0] === "Divide"
  ) {
    const numerator = args[0][1],
      denominator = args[0][2];
    if (
      Array.isArray(numerator) &&
      numerator[0] === "PartialDerivative" &&
      Array.isArray(denominator)
    ) {
      const variable = denominator.find(
        (item) => typeof item === "string" && item !== "Multiply",
      );
      if (variable) return ["PartialDerivative", args[1], variable];
    }
  }
  return normalized;
}

function visibleGroups(spec?: AnswerSpec): PaletteKey[] {
  const groups: PaletteKey[] = ["basic"];
  const vars = new Set([
    ...(spec?.allowed_variables ?? []),
    ...(spec?.bound_variables ?? []),
  ]);
  const ops = new Set([
    ...(spec?.allowed_operators ?? []),
    ...(spec?.calculus_operations ?? []),
  ]);
  if (["t", "n", "omega", "ω", "j"].some((name) => vars.has(name)))
    groups.push("signals");
  if (
    ["Integrate", "Derivative", "PartialDerivative", "Limit", "Sum"].some(
      (name) => ops.has(name),
    )
  )
    groups.push("calculus");
  if (
    ["s", "z"].some((name) => vars.has(name)) ||
    spec?.type === "transfer_function"
  )
    groups.push("control");
  return groups;
}

export type StructuredMathInputProps = {
  answerName: string;
  label?: string;
  spec?: AnswerSpec;
  className?: string;
  compact?: boolean;
  fieldClassName?: string;
};

export default function StructuredMathInput({
  answerName,
  label = "Mathematical answer",
  spec: suppliedSpec,
  className,
  compact,
  fieldClassName,
}: StructuredMathInputProps) {
  const fieldRef = useRef<MathfieldElement | null>(null);
  const setAnswer = useQuestionInstance((state) => state.setAnswer);
  const answer = useQuestionInstance((state) => state.answers[answerName]);
  const runtimeSpec = useQuestionInstance(
    (state) => state.quiz_data?.answer_specs?.[answerName],
  );
  const submitted = useQuestionInstance((state) => state.hasSubmitted);
  const spec = suppliedSpec ?? runtimeSpec;
  const [focused, setFocused] = useState(false);
  const [fallback, setFallback] = useState(false);
  const engine = useMemo(() => new ComputeEngine(), []);
  const groups = useMemo(() => visibleGroups(spec), [spec]);
  const latex =
    typeof answer === "object" && answer && "latex" in answer
      ? String(answer.latex)
      : typeof answer === "string"
        ? answer
        : "";

  const synchronize = (value: string) => {
    try {
      let mathjson = normalizeComputeMathJson(engine.parse(value).json);
      const direction = value.match(/\\lim_\{[^}]*\\to[^}]*\^\{?([+-])\}?/);
      if (direction && Array.isArray(mathjson) && mathjson[0] === "Limit") {
        const withoutDirection = value.replace(/\^\{?[+-]\}?/, "");
        mathjson = normalizeComputeMathJson(
          engine.parse(withoutDirection).json,
        );
        if (Array.isArray(mathjson) && mathjson[0] === "Limit")
          mathjson = [...mathjson, direction[1] === "+" ? "Above" : "Below"];
      }
      setAnswer(answerName, {
        latex: value,
        mathjson,
      } satisfies StructuredMathAnswer);
    } catch {
      setAnswer(answerName, {
        latex: value,
        mathjson: null,
      } satisfies StructuredMathAnswer);
    }
  };

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !("value" in field)) {
      setFallback(true);
      return;
    }
    field.value = latex;
    (field as unknown as { virtualKeyboardMode: string }).virtualKeyboardMode =
      "off";
    field.smartMode = true;
    const onInput = () => synchronize(field.value);
    const onFocus = () => setFocused(true);
    const onBlur = () => globalThis.setTimeout(() => setFocused(false), 100);
    field.addEventListener("input", onInput);
    field.addEventListener("focus", onFocus);
    field.addEventListener("blur", onBlur);
    return () => {
      field.removeEventListener("input", onInput);
      field.removeEventListener("focus", onFocus);
      field.removeEventListener("blur", onBlur);
    };
  }, [answerName, engine]);

  useEffect(() => {
    const field = fieldRef.current;
    if (field && field.value !== latex) field.value = latex;
  }, [latex]);

  const insert = (item: PaletteItem) => {
    fieldRef.current?.executeCommand(["insert", item.insert]);
    fieldRef.current?.focus();
  };
  const allowedOps = new Set([
    ...(spec?.allowed_operators ?? []),
    ...(spec?.calculus_operations ?? []),
  ]);

  return (
    <div className={clsx("relative", className)} data-math-answer={answerName}>
      {!compact && (
        <label
          className="mb-1 block text-sm font-semibold"
          id={`${answerName}-label`}
        >
          {label}
        </label>
      )}
      {fallback ? (
        <input
          aria-label={`${label} (LaTeX)`}
          disabled={submitted}
          value={latex}
          onChange={(event) => synchronize(event.target.value)}
          onFocus={() => setFocused(true)}
          className={clsx(
            "w-full rounded-md border border-[var(--color-border-strong)] bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
            fieldClassName,
          )}
          placeholder="Enter LaTeX"
        />
      ) : (
        <math-field
          ref={(element) => {
            fieldRef.current = element as MathfieldElement | null;
          }}
          aria-label={label}
          aria-labelledby={!compact ? `${answerName}-label` : undefined}
          disabled={submitted}
          className={clsx(
            "block min-h-11 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-strong)] px-3 py-2 text-lg focus-within:ring-2 focus-within:ring-[var(--color-accent)]",
            compact && "min-h-9 px-2 py-1 text-sm",
            fieldClassName,
          )}
        />
      )}
      {focused && !submitted && (
        <div
          role="toolbar"
          aria-label="Math symbol palette"
          onMouseDown={(event) => event.preventDefault()}
          className="absolute left-0 top-full z-30 mt-2 max-h-64 w-[min(34rem,90vw)] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2 shadow-xl max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:mt-0 max-sm:w-full max-sm:rounded-b-none"
        >
          {groups.map((group) => {
            const items = PALETTES[group].filter(
              (item) =>
                !item.operator ||
                allowedOps.size === 0 ||
                allowedOps.has(item.operator),
            );
            if (!items.length) return null;
            return (
              <div key={group} className="mb-2">
                <div className="px-1 text-xs font-semibold capitalize text-[var(--color-text-muted)]">
                  {group}
                </div>
                <div className="flex flex-wrap gap-1">
                  {items.map((item) => (
                    <button
                      key={`${group}-${item.label}`}
                      type="button"
                      aria-label={`Insert ${item.label}`}
                      onClick={() => insert(item)}
                      className="min-h-9 rounded border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-surface-muted)]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
