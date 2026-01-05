import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";
import { useCallback, useEffect, useState } from "react";
import { QuestionAPI } from "../../services";
import type { QuizData } from "../../types/quizType";

export function getCurrentQuestionMetadata() {
  const { selectedQuestionID, setQuestionMeta, questionMeta } =
    useQuestionCollectionContext();
  const [error, setError] = useState<string | null>(null);
  const fetchQuestionMeta = useCallback(async () => {
    if (!selectedQuestionID) return;
    try {
      const retrieved = await QuestionAPI.getQuestionMeta(selectedQuestionID);
      setQuestionMeta(retrieved);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch question Metadata";
      setError(errorMessage);
    }
  }, [selectedQuestionID, setQuestionMeta]);

  useEffect(() => {
    fetchQuestionMeta();
  }, [fetchQuestionMeta]);

  return { questionMeta, error };
}

export function fetchQuestion() {
  const { selectedQuestionID } = useQuestionCollectionContext();

  // Content to fetch
  const [questionHtml, setQuestionHTML] = useState<string | null>(null);
  const [solutionHtml, setSolutionHTML] = useState<string | null>(null);

  // Keep track of any erros or loading states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ErrorBase = "Failed to Fetch Question Files ";

  const fetchFiles = useCallback(async () => {
    if (!selectedQuestionID) {
      setError(`${ErrorBase}: No Question Selected`);
      return;
    }
    setLoading(true);
    try {
      const [rawHTMLRes, rawSolutionRes] = await Promise.all([
        QuestionAPI.getQuestionFile(selectedQuestionID, "question.html"),
        QuestionAPI.getQuestionFile(selectedQuestionID, "solution.html"),
      ]);
      setQuestionHTML(rawHTMLRes.data);
      setSolutionHTML(rawSolutionRes.data);
    } catch (error: any) {
      let errorMessage =
        ErrorBase + (error.message ?? "Failed to fetch base html files");
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedQuestionID]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  return { questionHtml, solutionHtml, loading, error };
}

export function fetchAdaptiveParameters({
  serverSettings,
}: {
  serverSettings: "javascript" | "python";
}) {
  const { selectedQuestionID } = useQuestionCollectionContext();
  // Storing the parameters for the question
  const [params, setParams] = useState<QuizData | null>(null);

  // Manage loading states and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ErrorBase = "Failed to get Adaptive Parameters for Question";
  const fetchParams = useCallback(async () => {
    if (!selectedQuestionID) return;
    setLoading(true);

    try {
      const res = await QuestionAPI.runServer(
        selectedQuestionID,
        serverSettings
      );
      setParams(res);
    } catch (error: any) {
      let errorMsg =
        ErrorBase +
        (error.message || error.response.data.detail || "Unknown error");
      console.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedQuestionID, serverSettings]);

  useEffect(() => {
    fetchParams();
  }, [fetchParams]);

  // Refetch is used if we want to get new values
  return { params, loading, error, refetch: fetchParams };
}
