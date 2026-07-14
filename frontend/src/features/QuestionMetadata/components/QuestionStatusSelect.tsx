import type { Dispatch } from "react";
import { useId } from "react";

import {
  QUESTION_STATUS_OPTIONS,
  type QuestionStatus,
} from "../../../types/questionTypes";

type QuestionStatusSelectProps = {
  value: QuestionStatus;
  onChange: Dispatch<QuestionStatus>;
  label?: string;
  showLabel?: boolean;
};

export function QuestionStatusSelect({
  value,
  onChange,
  label = "Status",
  showLabel = true,
}: QuestionStatusSelectProps) {
  const selectId = useId();

  return (
    <div className="w-full flex flex-col gap-2">
      {showLabel && (
        <label
          htmlFor={selectId}
          className="text-sm font-semibold text-text-muted"
        >
          {label}
        </label>
      )}

      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value as QuestionStatus)}
        className="w-full rounded-md border border-border bg-bg px-3 py-3 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
      >
        {QUESTION_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
