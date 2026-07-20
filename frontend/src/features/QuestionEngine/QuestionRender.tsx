import type { QuestionRuntimeLanguage } from "../../services";
import { QuestionInstanceProvider, useQuestionInstance } from "./instance";
import QuestionRenderShell from "./layout/QuestionRenderShell";
import { useRunQuestion } from "./runtime/useQuestionRunTime";

type QuestionRenderProps = {
  qid: string;
  serverSettings: QuestionRuntimeLanguage;
  withProvider?: boolean;
};

function QuestionRenderBody({ qid, serverSettings }: QuestionRenderProps) {
  const refreshKey = useQuestionInstance((s) => s.refreshKey);
  const previousCircuitVariant = useQuestionInstance(
    (s) => s.previousCircuitVariant,
  );
  const { qPayload, error, loading } = useRunQuestion(
    qid,
    serverSettings,
    refreshKey,
    previousCircuitVariant,
  );
  if (error) {
    return (
      <div
        className="w-full rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        role="alert"
      >
        <div className="font-semibold">Code execution failed</div>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
          {error}
        </pre>
      </div>
    );
  }

  if (loading || !qPayload) {
    return (
      <div
        className="flex min-h-130 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-sm font-medium text-text-muted"
        role="status"
        aria-live="polite"
      >
        Loading question...
      </div>
    );
  }

  return <QuestionRenderShell qpayload={qPayload} />;
}

export default function QuestionRender({
  withProvider = true,
  ...props
}: QuestionRenderProps) {
  if (!withProvider) {
    return <QuestionRenderBody {...props} />;
  }

  return (
    <QuestionInstanceProvider>
      <QuestionRenderBody {...props} />
    </QuestionInstanceProvider>
  );
}
