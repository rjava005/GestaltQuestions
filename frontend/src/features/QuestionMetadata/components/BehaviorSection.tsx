import { Settings } from "lucide-react";
import type { Dispatch } from "react";

import { QuestionMetadataSection } from "./QuestionMetadataSection";

type BehaviorSectionProps = {
  aiGenerated: boolean;
  isAdaptive: boolean;
  onAiGeneratedChange: Dispatch<boolean>;
  onAdaptiveChange: Dispatch<boolean>;
};

type BooleanCheckboxFieldProps = {
  label: string;
  description: string;
  value: boolean;
  onChange: Dispatch<boolean>;
};

function BooleanCheckboxField({
  label,
  description,
  value,
  onChange,
}: BooleanCheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-bg p-3 transition-colors hover:border-border-strong">
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-border accent-accent"
      />

      <span>
        <span className="block text-sm font-semibold text-text">{label}</span>
        <span className="mt-1 block text-sm text-text-muted">
          {description}
        </span>
      </span>
    </label>
  );
}

export function BehaviorSection({
  aiGenerated,
  isAdaptive,
  onAiGeneratedChange,
  onAdaptiveChange,
}: BehaviorSectionProps) {
  return (
    <QuestionMetadataSection title="Behavior" icon={Settings}>
      <div className="grid gap-4 md:grid-cols-2">
        <BooleanCheckboxField
          label="AI Generated"
          description="Question content was generated or assisted by AI."
          value={aiGenerated}
          onChange={onAiGeneratedChange}
        />
        <BooleanCheckboxField
          label="Adaptive"
          description="Requires a JavaScript or Python file for execution."
          value={isAdaptive}
          onChange={onAdaptiveChange}
        />
      </div>
    </QuestionMetadataSection>
  );
}
