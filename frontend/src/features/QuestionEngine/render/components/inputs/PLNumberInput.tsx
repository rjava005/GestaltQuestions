import { MathJax } from "better-react-mathjax";
import clsx from "clsx";
import React from "react";

import { useQuestionInstance } from "../../../instance";
import { uiInputStyles } from "../../../styles";

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
            uiInputStyles.fieldset,
            variantStyles[variant],
            className,
            submitted && "opacity-60",
          )}
        >
          <label
            htmlFor={answerName}
            className={clsx(
              "text-sm font-bold px-2",
              submitted ? "text-text-disabled" : "text-text-muted",
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
            placeholder={String(answerName)}
            value={inputValue}
            onChange={(e) => setAnswer(answerName, e.target.value)}
            className={clsx(
              uiInputStyles.base,
              submitted &&
                "cursor-not-allowed bg-surface-muted text-text-disabled",
            )}
          />
        </fieldset>
      </div>
    </MathJax>
  );
};

export default PLNumberInput;
