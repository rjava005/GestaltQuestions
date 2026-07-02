// Question Metadata
import type { FileData } from "../../../types/fileTypes";
import { type QuestionRead } from "../../../types/questionTypes";
// General Types for the values

export type QuestionValue = string | number | string[] | boolean | null;
export type QuestionAnswerMap = Record<string, QuestionValue>;

// Raw from backend using camel case
export type QuestionRunTimeResponse = {
  instance: string | number;
  question_meta?: QuestionRead | null;
  question_html: string;
  solution_html?: string;
  logs?: string[];
  files?: FileData[];
  quiz_data?: QuizData | null;
};

// domain state (frontend)
export type QuestionInstanceState = {
  runInstanceId: string | null;
  questionMeta?: QuestionRead | null;
  questionHtml: string;
  solutionHtml: string | null;
  logs: string[];
  quizData: QuizData | null;
  files?: FileData[];

  answers: QuestionAnswerMap;
  hasSubmitted: boolean;

  loading: boolean;
  error: string | null;
};

//  The payload from the backend the pure QuizData
export type QuestionParams = {
  params: QuestionAnswerMap;
  correct_answers: QuestionAnswerMap;
  sigfigs?: number;
};
export type QuizData = QuestionParams & {
  nDigits?: number;
  sigfigs?: number;
  logs?: string[];
};

export type QuestionInstanceActions = {
  setRunTimeContent: (payload: QuestionRunTimeResponse) => void; // Meant to store new instances of the question
  setAnswer: (name: string, value: QuestionValue) => void;
  resetAnswers: () => void;
  submitAnswers: () => void;
  resetSubmissions: () => void;
  startLoading: () => void;
  setError: (message: string | null) => void;
  resetAll: () => void;
};

export type QuestionInstanceStore = QuestionInstanceState &
  QuestionInstanceActions;
