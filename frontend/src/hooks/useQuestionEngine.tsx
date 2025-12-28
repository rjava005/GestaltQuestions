// questionHooks.ts
import { useState, useCallback, useEffect, } from "react";
import type { QuizData } from "../types/quizType";
import { useCodeEditorContext } from "../context/CodeEditorContext";
import { QuestionAPI } from "../services/api/backend/questionAPI";
import type { QuestionData } from "../types/questionTypes";
import { useQuestionContext } from "../context/QuestionCollectionContext";
import applyPlaceHolders from "../utils/flattenParams";

export function useRetrievedQuestions({
  questionFilter,
  showAllQuestions,
}: {
  questionFilter: QuestionData;
  showAllQuestions: boolean;
}) {
  const { setQuestions } = useQuestionContext();
  const fetchQuestions = useCallback(async () => {
    try {
      const filter = showAllQuestions ? {} : questionFilter;
      const retrieved = await QuestionAPI.filterQuestions(filter);
      setQuestions(retrieved);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  }, [showAllQuestions, questionFilter, setQuestions]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);
}

export function useAdaptiveParams(isAdaptive: boolean) {
  const { codeRunningSettings, setLogs } = useCodeEditorContext();
  const { selectedQuestionID } = useQuestionContext();

  const [params, setParams] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParams = useCallback(async () => {
    if (!isAdaptive || !selectedQuestionID) return;
    try {
      setLoading(true);
      setError(null);
      const res = await QuestionAPI.runServer(selectedQuestionID, codeRunningSettings);
      setParams(res);
      if (res?.logs) setLogs(res.logs);
    } catch (err: any) {
      console.error("Error fetching adaptive params:", err);
      console.log(err.response.data.detail)
      setError(err.response.data.detail ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [isAdaptive, selectedQuestionID, codeRunningSettings]);

  useEffect(() => {
    if (isAdaptive) fetchParams();
  }, [fetchParams, isAdaptive]);

  return { params, loading, error, refetch: fetchParams };
}


export function useRawQuestionHTML() {
  const { selectedQuestionID } = useQuestionContext();
  const { refreshKey } = useCodeEditorContext()
  const [questionHtml, setQuestionHtml] = useState<string | null>(null);
  const [solutionHTML, setSolutionHTML] = useState<| null | string>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null)


  const fetchBaseFiles = useCallback(async () => {
    if (!selectedQuestionID) return;
    setLoading(true)
    try {
      const [rawHTMLRes, rawSolutionRes] = await Promise.all([
        QuestionAPI.getQuestionFile(selectedQuestionID, "question.html"),
        QuestionAPI.getQuestionFile(selectedQuestionID, "solution.html")
      ])
      setQuestionHtml(rawHTMLRes.data)
      setSolutionHTML(rawSolutionRes.data)
    }
    catch (error: any) {
      console.log("Failed to fetch base html files", error);
      setError(error.message || "Failed to fetch base html files")
    }
    finally {
      setLoading(false)
    }
  }, [selectedQuestionID, refreshKey])

  useEffect(() => {
    fetchBaseFiles();
  }, [fetchBaseFiles]);

  return { questionHtml, solutionHTML, loading, error };
}

type ParsedHTMLResult = {
  qHTML: string;
  sHTML: string;
};
/**
 * Parses the given question and solution HTML, replacing placeholders using provided params.
 */
export function useParsedQuestionHTML(
  questionHTML: string,
  params: QuizData | null,
  solutionHTML?: string
): ParsedHTMLResult | undefined {
  const [qHTML, setQHTML] = useState<string>("");
  const [sHTML, setSHtml] = useState<string>("");

  useEffect(() => {
    if (!params) return;

    const qProcessed = applyPlaceHolders(questionHTML, params);
    const sProcessed = applyPlaceHolders(solutionHTML ?? "", params);

    setQHTML(qProcessed);
    setSHtml(sProcessed);
  }, [params, questionHTML, solutionHTML]);

  if (!params) return undefined;

  return { qHTML, sHTML };
}