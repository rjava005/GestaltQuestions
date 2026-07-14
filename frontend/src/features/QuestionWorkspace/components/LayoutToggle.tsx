import clsx from "clsx";
import type React from "react";
import { FiColumns, FiMaximize2 } from "react-icons/fi";

import type { WorkspaceLayoutMode } from "../instance/types";

type LayoutToggleProps = {
  value: WorkspaceLayoutMode;
  onChange: (mode: WorkspaceLayoutMode) => void;
};

const layoutOptions: Array<{
  value: WorkspaceLayoutMode;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "single",
    label: "Single",
    icon: <FiMaximize2 className="h-4 w-4" />,
  },
  {
    value: "split",
    label: "Split",
    icon: <FiColumns className="h-4 w-4" />,
  },
];

export function LayoutToggle({ value, onChange }: LayoutToggleProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Layout
        </span>
        <span className="text-xs text-text-muted">Workspace arrangement</span>
      </div>

      <div className="inline-grid grid-flow-col gap-1 rounded-md border border-border-strong bg-[var(--color-surface-muted)] p-1">
        {layoutOptions.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-[calc(var(--radius-md)-4px)] px-4 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:bg-surface-secondary hover:text-text",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
