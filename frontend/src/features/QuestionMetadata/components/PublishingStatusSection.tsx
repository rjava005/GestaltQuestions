import { Globe2 } from "lucide-react";
import type { Dispatch } from "react";

import type { QuestionStatus } from "../../../types/questionTypes";
import { getStatusDescription } from "../utils";
import { QuestionMetadataSection } from "./QuestionMetadataSection";
import { QuestionStatusSelect } from "./QuestionStatusSelect";

type PublishingStatusSectionProps = {
  status: QuestionStatus;
  onStatusChange: Dispatch<QuestionStatus>;
};

export function PublishingStatusSection({
  status,
  onStatusChange,
}: PublishingStatusSectionProps) {
  return (
    <QuestionMetadataSection title="Publishing" icon={Globe2}>
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-sm font-medium text-text-muted">
          <span>Status</span>
          <span className="text-red-400">*</span>
        </div>

        <QuestionStatusSelect
          value={status}
          onChange={onStatusChange}
          showLabel={false}
        />

        <p className="text-sm text-text-muted">
          {getStatusDescription(status)}
        </p>
      </div>
    </QuestionMetadataSection>
  );
}
