import { aiApi } from "../client";

export type QuestionDataText = {
  question: string;
};

export class AIWorkspaceAPI {
  private static readonly base = "/gestal_module/";

  static async generateText(question: QuestionDataText) {
    const response = await aiApi.post(this.base, question);
    return response.data;
  }
  static async generateImage(file: File) {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await aiApi.post(`${this.base}image`, formData);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
}
