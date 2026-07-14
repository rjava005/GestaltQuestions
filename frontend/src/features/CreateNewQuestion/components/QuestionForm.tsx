import type { Dispatch } from "react";

import { BooleanField, InputTextForm } from "../../../components/FormInputs";
import {
  normalizeQuestionTypes,
  type QuestionCreate,
} from "../../../types/questionTypes";
import { handleCommaSeperatedValues } from "../../../utils";

export type QuestionFormProps = {
  value: QuestionCreate | null | undefined;
  onChange: Dispatch<QuestionCreate>;
  onAdaptiveChange?: Dispatch<boolean>;
};

export default function QuestionForm({
  value,
  onChange,
  onAdaptiveChange,
}: QuestionFormProps) {
  if (!value) return null;

  const topicsInput = (value.topics ?? []).join(", ");
  const qTypesInput = (value.qType ?? []).join(", ");

  const patch = (partial: Partial<QuestionCreate>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <section className="w-full h-full flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-strong/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
      <div className=" flex flex-col self-start border-b border-border pb-3">
        <h2 className="text-base font-semibold text-text">Question Metadata</h2>
        <p className="mt-1 text-sm text-text-muted">Define the question</p>
      </div>

      <div className="flex flex-col my-5 gap-5">
        <div className="rounded-xl border border-border bg-surface p-4">
          <InputTextForm
            label="Question Title"
            value={value.title ?? ""}
            type="text"
            id="question-title"
            variant="createQuestion"
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <InputTextForm
              id="topics"
              value={topicsInput}
              type="text"
              label="Topics"
              hint="Comma separated (e.g. dynamics, kinematics)"
              variant="createQuestion"
              onChange={(e) =>
                patch({ topics: handleCommaSeperatedValues(e.target.value) })
              }
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <InputTextForm
              id="question-type"
              value={qTypesInput}
              type="text"
              label="Question Types"
              hint="e.g. conceptual, numerical, coding"
              variant="createQuestion"
              onChange={(e) =>
                patch({
                  qType: normalizeQuestionTypes(
                    handleCommaSeperatedValues(e.target.value),
                  ),
                })
              }
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <BooleanField
              label="Adaptive Question"
              value={value.isAdaptive ?? false}
              onChange={(isAdaptive) => {
                onAdaptiveChange?.(isAdaptive);
                patch({ isAdaptive });
              }}
            />

            <BooleanField
              label="AI Generated"
              value={value.ai_generated ?? false}
              onChange={(ai_generated) => patch({ ai_generated })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
