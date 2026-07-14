import { MathJax } from "better-react-mathjax";
import clsx from "clsx";
import React from "react";

import { useQuestionInstance } from "../../../instance";

export type PLNumberInputProps = {
  answerName: string;
  comparison: string;
  digits: number | string;
  label: string | number;
  className?: string;
  variant?: keyof typeof variantStyles;
};

const variantStyles: Record<string, string> = {
  default: "bg-[var(--color-surface)]",
  minimal: "bg-[var(--color-surface-muted)]",
};

const PLNumberInput: React.FC<PLNumberInputProps> = ({
  answerName,
  className = "",
  digits,
  label,
  variant = "default",
}) => {
  const step = 1 / Math.pow(10, Number(digits) || 0);

  const currentResponse = useQuestionInstance((s) => s.answers[answerName]);
  const setAnswer = useQuestionInstance((s) => s.setAnswer);
  const submitted = useQuestionInstance((s) => s.hasSubmitted);
  const inputValue =
    typeof currentResponse === "string" || typeof currentResponse === "number"
      ? currentResponse
      : "";

  return (
    <MathJax>
      <div className={className}>
        <fieldset
          className={clsx(
            "mb-4 flex w-full max-w-[620px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)]",
            variantStyles[variant],
            submitted && "opacity-60",
          )}
        >
          <label
            htmlFor={answerName}
            className={clsx(
              "flex min-w-[140px] items-center border-r border-[var(--color-border)] px-4 py-3 text-sm font-semibold",
              submitted
                ? "text-[var(--color-text-soft)]"
                : "text-[var(--color-text)]",
            )}
          >
            {label}
          </label>
          <input
            id={answerName}
            name={answerName}
            disabled={submitted}
            type="number"
            step={step}
            placeholder="Enter your answer"
            value={inputValue}
            onChange={(e) => setAnswer(answerName, e.target.value)}
            className={clsx(
              "min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)]",
              submitted &&
                "cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-soft)]",
            )}
          />
        </fieldset>
      </div>
    </MathJax>
  );
};

export default PLNumberInput;
