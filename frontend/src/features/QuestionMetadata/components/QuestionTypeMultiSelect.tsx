import type { Dispatch } from "react";

import {
  QUESTION_TYPE_OPTIONS,
  type QuestionType,
} from "../../../types/questionTypes";

type QuestionTypeMultiSelectProps = {
  value: QuestionType[];
  onChange: Dispatch<QuestionType[]>;
  label?: string;
};

export function QuestionTypeMultiSelect({
  value,
  onChange,
  label = "Question Types",
}: QuestionTypeMultiSelectProps) {
  const selectedLabels = QUESTION_TYPE_OPTIONS.filter((option) =>
    value.includes(option.value),
  ).map((option) => option.label);

  const toggleType = (nextValue: QuestionType) => {
    onChange(
      value.includes(nextValue)
        ? value.filter((item) => item !== nextValue)
        : [...value, nextValue],
    );
  };

  return (
    <div className="w-full flex flex-col gap-2 ">
      <label className="text-sm font-semibold text-text-muted">{label}</label>

      <details className="relative">
        <summary className="w-full cursor-pointer list-none rounded-md border border-border bg-surface-strong px-3 py-2.5 text-sm text-text shadow-sm hover:border-border-strong">
          {selectedLabels.length
            ? selectedLabels.join(", ")
            : "Select question types"}
        </summary>

        <div className="absolute z-20 mt-1 max-h-32 w-full  overflow-auto rounded-md border border-border bg-surface-strong p-2 shadow-lg">
          {QUESTION_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-text hover:bg-surface"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => toggleType(option.value)}
                className="h-4 w-4 rounded border-border"
              />
              {option.label}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
