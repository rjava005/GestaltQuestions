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
