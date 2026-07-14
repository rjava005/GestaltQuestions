import { useEffect, useState } from "react";

import {
  QuestionTablesApi,
  type QuestionTableSearchParams,
} from "../../../services";
import { type QuestionTableRow } from "../../../services";
import { useAuth } from "../../Auth";

export function useAllQuestions(params?: QuestionTableSearchParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionTableRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await QuestionTablesApi.searchPublishedQuestions(params);
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load questions",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return { questions, loading, error };
}

export function useMyQuestions(params?: QuestionTableSearchParams) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionTableRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user) {
        setQuestions([]);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const data = await QuestionTablesApi.searchMyQuestions(token, params);
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load questions",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user, params]);
  return { questions, loading, error };
}
