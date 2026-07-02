import { MathJax } from "better-react-mathjax";
import clsx from "clsx";
import React from "react";

export type PLHintVariant = "default" | "highlighted";

export interface PLHintProps {
  level: number | string;
  children?: React.ReactNode;
  variant?: PLHintVariant | string;
  className?: string;
}

const variantStyles: Record<PLHintVariant, string> = {
  default: "border border-[var(--color-border)] bg-[var(--color-surface)]",
  highlighted:
    "border border-[var(--color-border-strong)] bg-[var(--color-surface-strong)]",
};

export default function PLHint({
  level,
  children,
  variant = "default",
  className = "",
}: PLHintProps) {
  return (
    <MathJax>
      <div
        className={clsx(
          "flex w-full items-start gap-4 rounded-md p-4 mb-3 transition-all duration-(--duration-base)",
          variantStyles[variant as PLHintVariant],
          className,
        )}
      >
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border-strong bg-surface-muted text-sm font-semibold text-accent shadow-sm">
          {level}
        </div>

        <div className="max-w-none text-left text-text">{children}</div>
      </div>
    </MathJax>
  );
}
