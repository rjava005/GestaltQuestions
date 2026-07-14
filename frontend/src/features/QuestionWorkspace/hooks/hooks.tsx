import { useEffect } from "react";
import { useState } from "react";

import { QuestionRuntimeApi } from "../../../services";
import type {
  QuestionRuntimeLanguage,
  QuestionRuntimeResponse,
} from "../../../services/QuestionRuntime";

export function useGetQuestionRunTimes(qid: string) {
  const [runtimes, setRuntimes] = useState<QuestionRuntimeResponse[]>([]);
  const [runtimeLanguages, setRuntimeLanguages] = useState<
    QuestionRuntimeLanguage[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qid) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await QuestionRuntimeApi.listRuntimes(qid);

        if (!cancelled) {
          setRuntimes(data);
          setRuntimeLanguages(data.map((v) => v.language));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [qid]);

  return {
    runtimes,
    runtimeLanguages,
    loading,
    error,
  };
}
