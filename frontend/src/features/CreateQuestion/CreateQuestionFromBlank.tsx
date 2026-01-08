

import QuestionMeta from "./QuestionMetadataField";
import QuestionFiles from "./QuestionFiles";

import { useState } from "react";
import { QuestionDirectoryPreview } from "./QuestionDirectoryPreview";

import { Button } from "../../components/Button";
import { useQuestionCreation } from './hooks';

export function CreateQuestionFromBlank() {
  const [showPreview, setShowPreview] = useState(false);
  const { createQuestion } = useQuestionCreation()

  return (
    <div className="flex h-full w-full gap-6">
      {/* Main editor column */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            name={
              showPreview ? "Hide Directory Preview" : "Show Directory Preview"
            }
            onClick={() => setShowPreview((prev) => !prev)}
          />
        </div>

        {/* Sections */}
        <div className="flex flex-row gap-5">
          <QuestionMeta />

          <QuestionFiles />

          {showPreview && (
            <div className="w-[280px] shrink-0">
              <div className="sticky top-4 rounded-md border border-slate-200 bg-white p-3">
                <h3 className="mb-2 text-sm font-medium text-slate-700">
                  Directory Preview
                </h3>
                <QuestionDirectoryPreview />
              </div>
            </div>
          )}
        </div>
        {/* Go to editor for final confirm */}
        <div className="flex flex-row gap-4 items-center justify-center">
          <Button onClick={async () => await createQuestion()} size="md" name="Create Question" className="max-w-1/2 grow" />

        </div>

      </div>
    </div>
  );
}
