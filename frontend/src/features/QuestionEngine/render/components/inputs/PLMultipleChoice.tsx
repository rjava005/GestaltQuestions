import clsx from "clsx";
import React from "react";
import { useState } from "react";

import { uiChoiceStyles } from "../../../styles";

export type PLAnswerProps = {
  correct: "true" | "false";
  children?: React.ReactNode;
};

export const PLAnswer: React.FC<PLAnswerProps> = ({ children }) => {
  return <>{children}</>;
};

const variantStyles: Record<string, string> = {
  default:
    "bg-[var(--color-surface)] border border-[var(--color-border-strong)]",
  minimal: "bg-[var(--color-surface-muted)] border border-transparent",
};

export type PLMultipleChoiceProps = {
  answersName: string;
  multiple: boolean;
  weight?: number;
  inline?: boolean;
  style?: keyof typeof variantStyles;
  showCorrectness?: boolean;
  children?: React.ReactNode;
};

export const PLMultipleChoice: React.FC<PLMultipleChoiceProps> = ({
  answersName,
  multiple = false,
  inline = false,
  showCorrectness = false,
  style = "default",
  children,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  const answersText = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<PLAnswerProps> =>
      React.isValidElement(child),
  );

  const handleChange = (answer: string) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(answer)
          ? prev.filter((v) => v !== answer)
          : [...prev, answer],
      );
    } else {
      setSelected([answer]);
    }
  };

  // useEffect(() => setResponse(answersName, selected), [answersName, selected, setResponse]);

  return (
    <fieldset
      className={clsx(
        "mb-4 w-full max-w-180 rounded-md p-4",
        variantStyles[style],
      )}
    >
      <legend className="px-1 text-sm font-semibold text-text-muted">
        {answersName}
      </legend>
      <div
        className={clsx(
          "mt-3",
          inline
            ? "grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
            : "flex flex-col gap-2",
        )}
      >
        {answersText.map((answer, index) => {
          const isCorrect = answer.props.correct === "true";
          const answerValue = String(answer.props.children ?? "");
          const isSelected = selected.includes(answerValue);

          return (
            <label
              key={index}
              className={clsx(
                uiChoiceStyles.option,
                "group flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 transition-colors",
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface-strong hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]",
                showCorrectness &&
                  (isCorrect
                    ? uiChoiceStyles.optionCorrect
                    : uiChoiceStyles.optionIncorrect),
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={answersName}
                checked={isSelected}
                onChange={() => handleChange(answerValue)}
                className="h-4 w-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)]">
                {answer.props.children}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default PLMultipleChoice;
