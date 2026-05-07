import { type QuestionRunTimeResponse } from "../instance/types";
import api from "../../../services/client";

export class QuestionRunnerApi {
  private static readonly base = "/runtime/questions";

  static async runQuestion(
    qid: string,
    language: string,
  ): Promise<QuestionRunTimeResponse> {
    const response = await api.post<QuestionRunTimeResponse>(
      `${this.base}/${encodeURIComponent(qid)}`,
      undefined,
      { params: { language } },
    );
    return response.data;
  }
}
