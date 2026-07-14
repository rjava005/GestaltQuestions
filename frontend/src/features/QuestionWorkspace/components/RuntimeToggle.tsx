import clsx from "clsx";
import type React from "react";
import { FaPython } from "react-icons/fa";
import { IoLogoJavascript } from "react-icons/io5";
import { MdBolt } from "react-icons/md";

import type { QuestionRuntimeLanguage } from "../../../services/QuestionRuntime";

export type RuntimeToggleValue = QuestionRuntimeLanguage;

type RuntimeToggleProps = {
  value: RuntimeToggleValue | null;
  options?: RuntimeToggleValue[];
  onChange: (next: RuntimeToggleValue) => void;
};

const fallbackOptions: RuntimeToggleValue[] = ["javascript", "python"];

const runtimeMeta: Record<
  RuntimeToggleValue,
  {
    label: string;
    icon: React.ReactNode;
  }
> = {
  javascript: {
    label: "JavaScript",
    icon: <IoLogoJavascript className="h-4 w-4" />,
  },
  python: {
    label: "Python",
    icon: <FaPython className="h-4 w-4" />,
  },
  static: {
    label: "Static",
    icon: <MdBolt className="h-4 w-4" />,
  },
};

export function RuntimeToggle({
  value,
  options = fallbackOptions,
  onChange,
}: RuntimeToggleProps) {
  const runtimeOptions = options.length ? options : fallbackOptions;
  const selectedValue = value ?? runtimeOptions[0];

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Runtime
        </span>
        <span className="text-xs text-text-muted">Executes preview with</span>
      </div>

      <div className="inline-grid grid-flow-col gap-1 rounded-md border border-border-strong bg-[var(--color-surface-muted)] p-1">
        {runtimeOptions.map((runtime) => {
          const active = runtime === selectedValue;
          const meta = runtimeMeta[runtime] ?? {
            label: runtime,
            icon: <MdBolt className="h-4 w-4" />,
          };

          return (
            <button
              key={runtime}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(runtime)}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-[calc(var(--radius-md)-4px)] px-4 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:bg-surface-secondary hover:text-text",
              )}
            >
              {meta.icon}
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
