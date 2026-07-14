import api from "../client";
import type { QuestionTableRow, QuestionTableSearchParams } from "./types";

export default class QuestionTablesApi {
  private static readonly base = "/question-tables";

  private static authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  static async searchQuestions(
    params: QuestionTableSearchParams = {},
  ): Promise<QuestionTableRow[]> {
    const response = await api.post<QuestionTableRow[]>(
      `${this.base}/search`,
      params,
    );
    return response.data;
  }

  static async searchPublishedQuestions(
    params: QuestionTableSearchParams = {},
  ): Promise<QuestionTableRow[]> {
    const response = await api.post<QuestionTableRow[]>(
      `${this.base}/published/search`,
      params,
    );
    return response.data;
  }

  static async searchMyQuestions(
    token: string,
    params: QuestionTableSearchParams = {},
  ): Promise<QuestionTableRow[]> {
    const response = await api.post<QuestionTableRow[]>(
      `${this.base}/me/search`,
      params,
      {
        headers: this.authHeaders(token),
      },
    );
    return response.data;
  }
}
