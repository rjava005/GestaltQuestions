import type { Dispatch } from "react";

import {
  BasicInfoSection,
  BehaviorSection,
  ClassificationSection,
  PublishingStatusSection,
  QuestionMetadataActions,
  QuestionMetadataHeader,
} from "./components";
import type { QuestionMetadataFormValue } from "./utils";

type QuestionMetadataFormProps = {
  value: QuestionMetadataFormValue;
  onChange: Dispatch<QuestionMetadataFormValue>;
  onReset?: () => void;
  onSubmit?: () => void;
  disableSubmit?: boolean;
  showPublishingStatus?: boolean;
  showActions?: boolean;
};

export function QuestionMetadataForm({
  value,
  onChange,
  onReset,
  onSubmit,
  disableSubmit = false,
  showPublishingStatus = true,
  showActions = true,
}: QuestionMetadataFormProps) {
  const patch = (partial: Partial<QuestionMetadataFormValue>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-6 text-text shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
      <QuestionMetadataHeader />

      <div className="mt-6 space-y-5">
        <BasicInfoSection
          title={value.title}
          onTitleChange={(title) => patch({ title })}
        />

        {showPublishingStatus && (
          <PublishingStatusSection
            status={value.status}
            onStatusChange={(status) => patch({ status })}
          />
        )}

        <BehaviorSection
          aiGenerated={value.ai_generated}
          isAdaptive={value.isAdaptive}
          onAiGeneratedChange={(ai_generated) => patch({ ai_generated })}
          onAdaptiveChange={(isAdaptive) => patch({ isAdaptive })}
        />

        <ClassificationSection
          topics={value.topics}
          qTypes={value.qType}
          onTopicsChange={(topics) => patch({ topics })}
          onQuestionTypesChange={(qType) => patch({ qType })}
        />

        {showActions && onReset && onSubmit && (
          <QuestionMetadataActions
            onReset={onReset}
            onSubmit={onSubmit}
            disabled={disableSubmit}
          />
        )}
      </div>
    </section>
  );
}
