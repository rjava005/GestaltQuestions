import type { QuestionRunResponse } from "../../../services/QuestionRuntime";
import type {
  QuestionAnswerMap,
  QuestionValue,
} from "../../../services/QuestionRuntime/types";

export type QuestionRuntimeState = Partial<QuestionRunResponse>;

export type QuestionInstanceState = QuestionRuntimeState & {
  answers: QuestionAnswerMap;
  hasSubmitted: boolean;
  refreshKey: number;
  showSolution: boolean;
};

export type QuestionInstanceActions = {
  setRunTimeContent: (payload: QuestionRunResponse) => void; // Meant to store new instances of the question
  setRefreshKey: () => void;
  setAnswer: (name: string, value: QuestionValue) => void;
  resetAnswers: () => void;
  submitAnswers: () => void;
  resetSubmissions: () => void;
  setShowSolution: () => void;
};

export type QuestionInstanceStore = QuestionInstanceState &
  QuestionInstanceActions;
