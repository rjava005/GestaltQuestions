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

  const handleGenerateVariant = () => {
    resetSubmission();
    resetAnswers();
    setRefreshKey();
  };
  const handleSubmit = () => {
    submitAnswers();
  };
  return (
    <div className="flex flex-wrap gap-3">
      <QuestionActionButton
        type="button"
        name="Submit"
        icon={FiSend}
        onClick={handleSubmit}
        disabled={hasSubmitted}
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
  );
}
