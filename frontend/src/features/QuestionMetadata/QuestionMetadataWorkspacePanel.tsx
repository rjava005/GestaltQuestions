import { useEffect, useMemo, useState } from "react";

import { useQuestionMetadata } from "../QuestionBuilder";
import { useUpdateQuestion } from "./hooks/hooks";
import { QuestionMetadataForm } from "./QuestionMetadataForm";
import {
  metadataValuesEqual,
  type QuestionMetadataFormValue,
  toQuestionMetadataFormValue,
} from "./utils";
type QuestionMetadataWorkspacePanelProps = {
  qid: string;
};

export default function QuestionMetadataWorkspacePanel({
  qid,
}: QuestionMetadataWorkspacePanelProps) {
  const { questionMetadata, loading } = useQuestionMetadata(qid);
  const { updateQuestion, loading: uloading } = useUpdateQuestion();

  const [value, setValue] = useState<QuestionMetadataFormValue>(
    toQuestionMetadataFormValue(null),
  );

  const originalValue = useMemo(
    () => toQuestionMetadataFormValue(questionMetadata),
    [questionMetadata],
  );

  useEffect(() => {
    setValue(originalValue);
  }, [originalValue]);

  const handleReset = () => {
    setValue(originalValue);
  };

  const handleSubmit = async () => {
    await updateQuestion(qid, value);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        Loading metadata...
      </div>
    );
  }

  if (!questionMetadata) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        No metadata available.
      </div>
    );
  }

  return (
    <QuestionMetadataForm
      value={value}
      onChange={setValue}
      onReset={handleReset}
      onSubmit={handleSubmit}
      disableSubmit={metadataValuesEqual(value, originalValue) || uloading}
    />
  );
}
