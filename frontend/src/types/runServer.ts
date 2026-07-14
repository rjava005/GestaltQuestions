import type { QuizData } from "../services/QuestionRuntime/types";
import { type CodeLanguage } from "./settingsType";

export type ServerRunSuccess = {
  status: "success";
  data: QuizData;
};

export type ServerExecutionError = {
  status: "execution_error";
  error_type: "runtime" | "syntax" | "dependency" | "timeout" | "validation";
  message: string;
  language: CodeLanguage;
  file?: string | null;
};

export type ServerRunResponse = ServerRunSuccess | ServerExecutionError;
