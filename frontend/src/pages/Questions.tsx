import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { QuestionRender } from "../features/QuestionEngine";
import { AllQuestionsTable } from "../features/QuestionTables";
import { RuntimeToggle } from "../features/QuestionWorkspace/components/RuntimeToggle";
import { useGetQuestionRunTimes } from "../features/QuestionWorkspace/hooks/hooks";
import type { QuestionRuntimeLanguage } from "../services/QuestionRuntime";

export default function Question() {
  const navigate = useNavigate();
  return (
    <div>
      <AllQuestionsTable
        onQuestionSelect={(qid) => navigate(`/questions/${qid}`)}
      />
    </div>
  );
}

export function GeneralQuestionRender() {
  const { qid } = useParams<{ qid: string }>();
  const { runtimeLanguages, loading, error } = useGetQuestionRunTimes(
    qid ?? "",
  );
  const [serverMode, setServerMode] =
    useState<QuestionRuntimeLanguage>("javascript");

  useEffect(() => {
    if (!runtimeLanguages.length) return;

    setServerMode((current) =>
      runtimeLanguages.includes(current) ? current : runtimeLanguages[0],
    );
  }, [runtimeLanguages]);

  if (!qid) return <div className="text-text-muted">Missing question id.</div>;

  return (
    <div className="flex w-full flex-col gap-3">
      <RuntimeToggle
        value={serverMode}
        options={runtimeLanguages}
        onChange={setServerMode}
      />

      {loading && (
        <div className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-muted">
          Loading runtimes...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <QuestionRender qid={qid} serverSettings={serverMode} />
    </div>
  );
}
