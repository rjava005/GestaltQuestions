import clsx from "clsx";
import type React from "react";
import { FiEye, FiFileText } from "react-icons/fi";
import { IoCodeSlash } from "react-icons/io5";

import type { WorkspacePane } from "../instance/types";

type ActivePanesToggleProps = {
  activePanes: WorkspacePane[];
  onTogglePane: (pane: WorkspacePane) => void;
};

const paneOptions: Array<{
  value: WorkspacePane;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "livePreview",
    label: "Preview",
    icon: <FiEye className="h-4 w-4" />,
  },
  {
    value: "editor",
    label: "Editor",
    icon: <IoCodeSlash className="h-4 w-4" />,
  },
  {
    value: "metadata",
    label: "Metadata",
    icon: <FiFileText className="h-4 w-4" />,
  },
];

export function ActivePanesToggle({
  activePanes,
  onTogglePane,
}: ActivePanesToggleProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Visible Panes
        </span>
        <span className="text-xs text-text-muted">Choose workspace panels</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {paneOptions.map((pane) => {
          const active = activePanes.includes(pane.value);

          return (
            <button
              key={pane.value}
              type="button"
              aria-pressed={active}
              onClick={() => onTogglePane(pane.value)}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-all",
                active
                  ? "border-accent bg-surface-strong text-accent shadow-sm"
                  : "border-border text-text-muted hover:border-border-strong hover:bg-surface-secondary hover:text-text",
              )}
            >
              {pane.icon}
              {pane.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
