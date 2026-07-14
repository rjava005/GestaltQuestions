import clsx from "clsx";
import React from "react";

import type { UIPanelSize, UIPanelVariant } from "../../../styles";

export interface PLQuestionPanelProps {
  children?: React.ReactNode;
  className?: string;
  size?: UIPanelSize | string;
  /** Visual variant */
  variant?: UIPanelVariant | string;
}

const PLQuestionPanel: React.FC<PLQuestionPanelProps> = ({
  children,
  className = "",
  size = "md",
  variant = "default",
}) => (
  <div
    className={clsx(
      "flex w-full flex-col items-start justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[linear-gradient(135deg,rgba(21,28,40,0.96),rgba(12,22,42,0.86))] p-6 text-left text-[var(--color-text)] shadow-[var(--shadow-soft)]",
      size === "xs" && "min-h-[150px]",
      size === "sm" && "min-h-[220px]",
      size === "md" && "min-h-[260px]",
      size === "lg" && "min-h-[360px]",
      size === "xl" && "min-h-[480px]",
      variant === "minimal" && "bg-[var(--color-surface-muted)] shadow-none",
      variant === "soft" && "bg-[var(--color-surface)] shadow-inner",
      variant === "elevated" && "border-[var(--color-border-strong)]",
      className,
    )}
  >
    {children}
  </div>
);

export default PLQuestionPanel;
