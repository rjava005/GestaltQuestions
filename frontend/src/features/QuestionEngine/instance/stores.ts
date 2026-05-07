import { createStore } from "zustand";
import type {
  QuestionInstanceState,
  QuestionRunTimeResponse,
  QuestionInstanceStore,
} from "./types";

export function toQuestionInstanceState(
  res: QuestionRunTimeResponse,
): Partial<QuestionInstanceState> {
  return {
    runInstanceId: String(res.instance),
    questionMeta: res.question_meta ?? null,
    questionHtml: res.question_html ?? "",
    solutionHtml: res.solution_html ?? null,
    logs: res.logs ?? [],
    quizData: res.quiz_data ?? null,
  };
}

const initialState: QuestionInstanceState = {
  runInstanceId: null,
  questionMeta: null,
  questionHtml: "",
  solutionHtml: null,
  logs: [],
  quizData: null,

  answers: {},
  hasSubmitted: false,

  loading: false,
  error: null,
};

export function createQuestionInstanceStore(
  preloaded?: Partial<QuestionInstanceState>,
) {
  return createStore<QuestionInstanceStore>()((set) => ({
    ...initialState,
    ...preloaded,

    setRunTimeContent: (payload) =>
      set(() => ({
        ...toQuestionInstanceState(payload),
        loading: false,
        error: null,
        hasSubmitted: false,
        answers: {},
      })),
    setAnswer: (name, value) =>
      set((state) => ({
        answers: { ...state.answers, [name]: value },
      })),
    resetAnswers: () => set(() => ({ answers: {} })),
    submitAnswers: () => set(() => ({ hasSubmitted: true })),
    resetSubmissions: () => set(() => ({ hasSubmitted: false })),
    startLoading: () => set(() => ({ loading: true, error: null })),
    setError: (message) => set(() => ({ error: message, loading: false })),

    resetAll: () => set(() => ({ ...initialState })),
  }));
}
