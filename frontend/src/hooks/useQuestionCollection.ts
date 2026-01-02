import type { QuestionData } from "../types/questionTypes";
import { useQuestionCollectionContext } from "../context/QuestionCollectionContext";
import { useCallback, useEffect } from "react";
import { QuestionAPI } from "../services/api/backend/questionAPI";

type UseRetrievedQuestionsArgs = {
  questionFilter?: Partial<QuestionData>;
  showAllQuestions?: boolean;
};

export function useRetrievedQuestions({
  questionFilter = {},
  showAllQuestions = true,
}: UseRetrievedQuestionsArgs) {
  const { setQuestions } = useQuestionCollectionContext();

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

export function useQuestionMeta() {
  const { selectedQuestionID, setQuestionMeta } =
    useQuestionCollectionContext();

  const fetchQuestionMeta = useCallback(async () => {
    if (!selectedQuestionID) return;
    try {
      const retrieved = await QuestionAPI.getQuestionMeta(selectedQuestionID);
      setQuestionMeta(retrieved);
    } catch (error) {
      console.error("❌ Failed to fetch question:", error);
    }
  }, [selectedQuestionID, setQuestionMeta]);

  useEffect(() => {
    fetchQuestionMeta();
  }, [fetchQuestionMeta]);
}
