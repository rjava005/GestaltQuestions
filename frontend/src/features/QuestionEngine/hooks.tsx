import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";
import { useCallback, useEffect, useState, useMemo } from "react";
import { QuestionAPI } from "../../services";
import type { QuizData } from "./types";
import { useQuestionEngineContext } from "./context";
import applyPlaceHolders from "../../utils/flattenParams";

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

export function fetchAdaptiveParameters() {
  const { serverSetting } = useQuestionEngineContext();
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
        serverSetting
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
  }, [selectedQuestionID, serverSetting]);

  useEffect(() => {
    fetchParams();
  }, [fetchParams]);

  // Refetch is used if we want to get new values
  return { params, loading, error, refetch: fetchParams };
}

type UseQuestionArgs = {
  isAdaptive: boolean;
};

export function useQuestion({ isAdaptive }: UseQuestionArgs) {
  const [formattedQuestion, setFormattedQuestion] = useState<string | null>(
    null
  );
  const [formattedSolution, setFormattedSolution] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch the question data first
  const {
    questionHtml,
    solutionHtml,
    loading: questionLoading,
    error: questionError,
  } = fetchQuestion();

  const {
    params,
    loading: paramsLoading,
    error: paramsError,
    refetch,
  } = fetchAdaptiveParameters();

  const processed = useMemo(() => {
    if (!questionHtml) return null;
    if (!isAdaptive || !params) {
      return {
        question: questionHtml,
        solution: solutionHtml ?? null,
      };
    }
    return {
      question: applyPlaceHolders(questionHtml, params),
      solution: solutionHtml ? applyPlaceHolders(solutionHtml, params) : null,
    };
  }, [isAdaptive, questionHtml, solutionHtml, params]);

  useEffect(() => {
    if (questionError) {
      setError(questionError);
      return;
    }

    if (paramsError) {
      setError(paramsError);
      return;
    }

    if (!processed) {
      setFormattedQuestion(null);
      setFormattedSolution(null);
      return;
    }

    setFormattedQuestion(processed.question);
    setFormattedSolution(processed.solution);
    setError(null);
  }, [processed, questionError, paramsError]);

  return {
    formattedQuestion,
    formattedSolution,
    loading: questionLoading || (isAdaptive && paramsLoading),
    error,
    refetch,
    params
  };
}
