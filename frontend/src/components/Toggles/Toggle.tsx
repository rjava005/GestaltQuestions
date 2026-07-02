import clsx from "clsx";
import React from "react";

type ToggleOption = {
  value: string;
  label: string;
  ariaLabel?: string;
  ariaLable?: string; // backward-compatible typo support
};

type ToggleVariant = "default" | "compact" | "emphasis";

export type ToggleProps = {
  options: ToggleOption[];
  selected: string;
  onChange: (val: string) => void;
  variant?: ToggleVariant;
  className?: string;
};

const groupVariantClasses: Record<ToggleVariant, string> = {
  default: "border-border bg-surface",
  compact: "border-border bg-surface p-0.5",
  emphasis:
    "border-accent/40 bg-surface shadow-[0_8px_22px_rgba(130,170,255,0.15)]",
};

const optionVariantClasses: Record<ToggleVariant, string> = {
  default: "px-3.5 py-1.5 text-sm",
  compact: "px-2.5 py-1 text-xs",
  emphasis: "px-3.5 py-1.5 text-sm",
};

export default function Toggle({
  options,
  selected,
  onChange,
  variant = "default",
  className,
}: ToggleProps) {
  const handleModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: string | null,
  ) => {
    if (!newMode) return;
    onChange(newMode);
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border p-1",
        groupVariantClasses[variant],
        className,
      )}
      role="radiogroup"
      aria-label="Toggle options"
    >
      {options.map(({ value, label, ariaLabel, ariaLable }) => {
        const isActive = selected === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={ariaLabel ?? ariaLable ?? label}
            className={clsx(
              "rounded-full border font-semibold leading-none transition-colors duration-200",
              optionVariantClasses[variant],
              isActive
                ? "border-border-strong bg-surface-strong text-text"
                : "border-transparent bg-transparent text-text-muted hover:bg-surface-muted hover:text-text",
              variant === "emphasis" &&
                isActive &&
                "border-accent/50 text-accent",
            )}
            onClick={(e) => handleModeChange(e, value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
