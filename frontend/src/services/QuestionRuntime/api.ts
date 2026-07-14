import { isAxiosError } from "axios";

import api from "../client";
import type {
  QuestionRunResponse,
  QuestionRuntimeCreateRequest,
  QuestionRuntimeLanguage,
  QuestionRuntimeResponse,
} from "./types";

type RuntimeErrorDetail = {
  status_code?: number;
  message?: string;
  execution_error?:
    | string
    | {
        message?: string;
        error_code?: string;
        exit_code?: number | null;
      };
};

function getRuntimeErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : String(error);
  }

  const detail = error.response?.data?.detail as
    | RuntimeErrorDetail
    | string
    | undefined;

  if (typeof detail === "string") {
    return detail;
  }

  const executionError = detail?.execution_error;

  if (typeof executionError === "string") {
    return executionError;
  }

  if (executionError?.message) {
    return executionError.message;
  }

  if (detail?.message) {
    return detail.message;
  }

  return error.message;
}

export default class QuestionRuntimeApi {
  private static readonly questionBase = "/questions";

  private static runtimeBase(qid: string) {
    return `${this.questionBase}/${encodeURIComponent(qid)}/runtimes`;
  }

  static async runQuestion(
    qid: string,
    language: QuestionRuntimeLanguage | null,
  ): Promise<QuestionRunResponse> {
    const url = language
      ? `${this.runtimeBase(qid)}/run?language=${encodeURIComponent(language)}`
      : `${this.runtimeBase(qid)}/run`;

    try {
      const response = await api.post<QuestionRunResponse>(url);
      return response.data;
    } catch (error) {
      throw new Error(getRuntimeErrorMessage(error));
    }
  }

  static async listRuntimes(qid: string): Promise<QuestionRuntimeResponse[]> {
    const response = await api.get<QuestionRuntimeResponse[]>(
      `${this.runtimeBase(qid)}/`,
    );
    return response.data;
  }

  static async createRuntime(
    qid: string,
    payload: QuestionRuntimeCreateRequest,
  ): Promise<QuestionRuntimeResponse> {
    const response = await api.post<QuestionRuntimeResponse>(
      `${this.runtimeBase(qid)}/`,
      payload,
    );
    return response.data;
  }

  static async syncRuntimesFromFiles(
    qid: string,
  ): Promise<QuestionRuntimeResponse[]> {
    const response = await api.post<QuestionRuntimeResponse[]>(
      `${this.runtimeBase(qid)}/sync-from-files`,
    );
    return response.data;
  }
}
