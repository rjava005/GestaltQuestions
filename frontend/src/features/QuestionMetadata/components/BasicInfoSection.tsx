import { FileText } from "lucide-react";
import type { Dispatch } from "react";

import { QuestionMetadataSection } from "./QuestionMetadataSection";

type BasicInfoSectionProps = {
  title: string;
  onTitleChange: Dispatch<string>;
  maxLength?: number;
};

export function BasicInfoSection({
  title,
  onTitleChange,
  maxLength = 120,
}: BasicInfoSectionProps) {
  return (
    <QuestionMetadataSection title="Basic Info" icon={FileText}>
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-sm font-medium text-text-muted">
          <label htmlFor="question-metadata-title">Title</label>
          <span className="text-red-400">*</span>
        </div>

        <div className="relative">
          <input
            id="question-metadata-title"
            value={title}
            maxLength={maxLength}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-3 pr-20 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
            {title.length} / {maxLength}
          </span>
        </div>

        <p className="text-sm text-text-muted">
          A clear, descriptive title helps others find and understand the
          question.
        </p>
      </div>
    </QuestionMetadataSection>
  );
}
