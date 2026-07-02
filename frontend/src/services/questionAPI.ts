import type { QuestionFilter, QuestionRead } from "../types/questionTypes";
import api from "./client";

export class QuestionAPI {
  private static readonly base = "/questions";

  static async getQuestion(qid: string): Promise<QuestionRead> {
    const response = await api.get<QuestionRead>(
      `${this.base}/${encodeURIComponent(qid)}`,
    );
    return response.data;
  }

  static async getAllQuestions(
    offset = 0,
    limit = 100,
  ): Promise<QuestionRead[]> {
    const response = await api.get<QuestionRead[]>(
      `${this.base}/${offset}/${limit}`,
    );
    return response.data;
  }

  static async filterQuestions(
    filter: QuestionFilter,
    offset = 0,
    limit = 100,
  ): Promise<QuestionRead[]> {
    const response = await api.post<QuestionRead[]>(
      `${this.base}/filter/${offset}/${limit}`,
      filter,
    );
    return response.data;
  }
}
