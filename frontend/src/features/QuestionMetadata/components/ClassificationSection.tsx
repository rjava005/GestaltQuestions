import { Tag } from "lucide-react";
import type { Dispatch } from "react";

import type { QuestionType } from "../../../types/questionTypes";
import { QuestionMetadataSection } from "./QuestionMetadataSection";
import { QuestionTypesSection } from "./QuestionTypesSection";
import { TopicsSection } from "./TopicsSection";

type ClassificationSectionProps = {
  topics: string[];
  qTypes: QuestionType[];
  onTopicsChange: Dispatch<string[]>;
  onQuestionTypesChange: Dispatch<QuestionType[]>;
};

export function ClassificationSection({
  topics,
  qTypes,
  onTopicsChange,
  onQuestionTypesChange,
}: ClassificationSectionProps) {
  return (
    <QuestionMetadataSection title="Classification" icon={Tag}>
      <div className="space-y-6">
        <TopicsSection topics={topics} onTopicsChange={onTopicsChange} />
        <QuestionTypesSection
          qTypes={qTypes}
          onQuestionTypesChange={onQuestionTypesChange}
        />
      </div>
    </QuestionMetadataSection>
  );
}
