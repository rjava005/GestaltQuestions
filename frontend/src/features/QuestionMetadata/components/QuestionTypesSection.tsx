import type { Dispatch } from "react";

import type { QuestionType } from "../../../types/questionTypes";
import { QuestionTypeMultiSelect } from "./QuestionTypeMultiSelect";

type QuestionTypesSectionProps = {
  qTypes: QuestionType[];
  onQuestionTypesChange: Dispatch<QuestionType[]>;
};

export function QuestionTypesSection({
  qTypes,
  onQuestionTypesChange,
}: QuestionTypesSectionProps) {
  return (
    <div className="space-y-2">
      <QuestionTypeMultiSelect
        value={qTypes}
        onChange={onQuestionTypesChange}
        label="Question Types"
      />
      <p className="text-sm text-text-muted">
        Add one or more question types, such as Multiple Choice or Numerical.
      </p>
    </div>
  );
}
