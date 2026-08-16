import type { QuestionRead } from "../../types/questionTypes";

export type QuestionRuntimeLanguage = "javascript" | "python" | "static";

export type RuntimeConfigSource = "manual" | "config_file" | "inferred";

export type MathJson = unknown;
export type StructuredMathAnswer = { latex: string; mathjson: MathJson };
export type QuestionRunValue =
  | string
  | number
  | string[]
  | boolean
  | null
  | StructuredMathAnswer;

export type QuestionRunAnswerMap = Record<string, QuestionRunValue>;

export type QuestionRunQuizData = {
  params: QuestionRunAnswerMap;
  correct_answers?: QuestionRunAnswerMap;
  answer_specs?: Record<string, AnswerSpec>;
  secure_grading?: boolean;
  sigfigs?: number;
  nDigits?: number;
  logs?: string[];
};

export type QuestionRuntimeCreateRequest = {
  language: QuestionRuntimeLanguage;
  entry: string;
  func_name?: string;
  is_default?: boolean;
  enabled?: boolean;
  source?: RuntimeConfigSource;
};

export type QuestionRuntimeResponse = {
  id: string;
  question_id: string;
  language: QuestionRuntimeLanguage;
  entry: string;
  func_name: string;
  is_default: boolean;
  enabled: boolean;
  source: RuntimeConfigSource;
};

export type QuestionRunResponse = {
  instance: string;
  qmeta: QuestionRead;
  question_html: string;
  solution_html?: string | null;
  logs: string[];
  quiz_data?: QuestionRunQuizData | null;
};

export type QuestionValue = QuestionRunValue;
export type QuestionAnswerMap = Record<string, QuestionValue>;

//  The payload from the backend the pure QuizData
export type QuestionParams = {
  params: QuestionAnswerMap;
  correct_answers?: QuestionAnswerMap;
  answer_specs?: Record<string, AnswerSpec>;
  sigfigs?: number;
};

export type AnswerSpec = {
  type: "numeric" | "symbolic" | "algebraic" | "transfer_function" | "calculus";
  allowed_variables?: string[];
  bound_variables?: string[];
  allowed_functions?: string[];
  allowed_operators?: string[];
  calculus_operations?: string[];
  units?: string | string[];
  absolute_tolerance?: number;
  relative_tolerance?: number;
};

export type SlotGrade = {
  status: "correct" | "incorrect" | "invalid";
  message?: string | null;
};
export type GradeResponse = {
  status: "correct" | "incorrect" | "invalid";
  answers: Record<string, SlotGrade>;
  solution_html?: string | null;
};
export type QuizData = QuestionParams & {
  nDigits?: number;
  sigfigs?: number;
  logs?: string[];
};
