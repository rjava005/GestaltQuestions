import clsx from "clsx";
import type { ComponentProps } from "react";
import { FiEye, FiEyeOff, FiRefreshCw, FiSend } from "react-icons/fi";

import { Button } from "../../../components/Button";
import { useQuestionInstance } from "../instance";

function QuestionActionButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      color="transparent"
      className={clsx(
        "inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] shadow-sm hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-secondary)] disabled:hover:scale-100",
        className,
      )}
    />
  );
}

export default function QuestionActions() {
  const resetAnswers = useQuestionInstance((s) => s.resetAnswers);
  const setRefreshKey = useQuestionInstance((s) => s.setRefreshKey);
  const setShowSolution = useQuestionInstance((s) => s.setShowSolution);
  const showSolution = useQuestionInstance((s) => s.showSolution);
  const submitAnswers = useQuestionInstance((s) => s.submitAnswers);
  const resetSubmission = useQuestionInstance((s) => s.resetSubmissions);
  const hasSubmitted = useQuestionInstance((s) => s.hasSubmitted);
  const isGrading = useQuestionInstance((s) => s.isGrading);
  const grading = useQuestionInstance((s) => s.grading);
  const gradingError = useQuestionInstance((s) => s.gradingError);

  const handleGenerateVariant = () => {
    resetSubmission();
    resetAnswers();
    setRefreshKey();
  };
  const handleSubmit = () => {
    void submitAnswers();
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <QuestionActionButton
          type="button"
          name="Submit"
          icon={FiSend}
          onClick={handleSubmit}
          disabled={hasSubmitted || isGrading}
          className="border-transparent bg-blue-500 text-white hover:bg-blue-600"
        />
        <QuestionActionButton
          type="button"
          onClick={handleGenerateVariant}
          name="New Variant"
          icon={FiRefreshCw}
        />
        <QuestionActionButton
          type="button"
          onClick={() => setShowSolution()}
          name={showSolution ? "Hide Solution" : "Show Solution"}
          icon={showSolution ? FiEyeOff : FiEye}
        />
      </div>
      {isGrading && (
        <div role="status" className="mt-3 text-sm">
          Grading answers…
        </div>
      )}
      {gradingError && (
        <div role="alert" className="mt-3 text-sm text-red-700">
          {gradingError}
        </div>
      )}
      {grading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 rounded border border-[var(--color-border)] p-3 text-sm"
        >
          <p className="font-semibold capitalize">Result: {grading.status}</p>
          <ul className="mt-1 list-inside list-disc">
            {Object.entries(grading.answers).map(([name, result]) => (
              <li key={name}>
                {name}: <span className="font-medium">{result.status}</span>
                {result.message ? ` — ${result.message}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
