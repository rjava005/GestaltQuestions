import api from "../client";
import type {
  QuestionBase,
  QuestionData,
  QuestionMeta,
} from "../../../types/questionTypes";
import type { SuccessDataResponse } from "../../../types/responseModels";
import type { FileData } from "../../../types/questionTypes";
import type {
  ServerRunResponse,
} from "../../../types";
import type { QuizData } from "../../../features/QuestionEngine";
import { type AxiosResponse } from "axios";
export class QuestionAPI {
  private static readonly base = "/questions";

  /** Create a new question */
  static async create(payload: QuestionData): Promise<QuestionBase> {
    const response = await api.post(this.base, payload);
    return response.data;
  }

  static async createWithFiles(payload: QuestionData, files: File[]) {
    const formData = new FormData();
    formData.append("question_data", JSON.stringify(payload));

    files.forEach((file) => formData.append("files", file));
    const response = await api.post(
      `${this.base}/files/`,

      formData,

      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  /** Delete all questions (use carefully) */
  static async deleteAll(): Promise<any> {
    const response = await api.delete(this.base);
    return response.data;
  }

  /** Get paginated questions */
  static async getAll(offset: number, limit: number): Promise<QuestionBase[]> {
    const response = await api.get(`${this.base}/${offset}/${limit}`);
    return response.data;
  }

  /** Get a question (full data) by ID */
  static async getQuestion(id: string | number): Promise<QuestionBase> {
    const response = await api.get(`${this.base}/${encodeURIComponent(id)}`);
    return response.data;
  }

  /** Get question metadata only by ID */
  static async getQuestionMeta(id: string | number): Promise<QuestionData> {
    const response = await api.get(
      `${this.base}/${encodeURIComponent(id)}/all_data`,
    );
    return response.data;
  }

  /** Get all question metadata (paginated) */
  static async getAllQuestionsMeta(
    offset: number,
    limit: number,
  ): Promise<QuestionMeta[]> {
    const response = await api.get(`${this.base}/${offset}/${limit}/all_data`);
    return response.data;
  }

  /** Delete a specific question by ID */
  static async deleteQuestion(id: string | number): Promise<any> {
    const response = await api.delete(`${this.base}/${encodeURIComponent(id)}`);
    return response.data;
  }

  /** Update an existing question by ID */
  static async updateQuestion(
    id: string | number,
    updatePayload: QuestionData,
  ): Promise<QuestionMeta> {
    const response = await api.put(
      `${this.base}/${encodeURIComponent(id)}`,
      updatePayload,
    );
    return response.data;
  }

  /** Filter questions by given criteria */
  static async filterQuestions(filter: QuestionData): Promise<QuestionData[]> {
    const response = await api.post(`${this.base}/filter`, filter);
    return response.data;
  }

  // Files
  static async getQuestionFile(
    questionId: string,
    filename: string,
  ): Promise<string> {
    const response = await api.get(
      `${this.base}/files/${encodeURIComponent(
        questionId,
      )}/${encodeURIComponent(filename)}`,
    );
    return response.data;
  }

  static async getQuestionFiles(questionID: string): Promise<FileData[]> {
    const response = await api.get(
      `/questions/files/filedata/${encodeURIComponent(questionID)}`,
    );
    return response.data;
  }

  static async updateFileContent(
    questionId: string,
    filename: string,
    new_content: string,
  ) {
    const response = await api.put(
      `${this.base}/files/${encodeURIComponent(
        questionId,
      )}/${encodeURIComponent(filename)}`,
      new_content,
    );
    return response;
  }

  static async uploadFiles(questionId: string, files: File[]) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      const response = await api.post(
        `${this.base}/files/${encodeURIComponent(questionId)}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteFile(
    questionId: string,
    filename: string,
  ): Promise<SuccessDataResponse> {
    const response = await api.delete(
      `${this.base}/files/${encodeURIComponent(
        questionId,
      )}/${encodeURIComponent(filename)}`,
    );
    return response.data;
  }

  static async runServer(
    questionId: string,
    language: "python" | "javascript",
  ): Promise<QuizData> {
    try {
      const res: AxiosResponse<ServerRunResponse> = await api.post(
        `run_server/${encodeURIComponent(questionId)}/${encodeURIComponent(
          language,
        )}`,
      );
      const payload = res.data;

      if (payload.status === "success") {
        return payload.data;
      } else {
        throw new Error(JSON.stringify(payload));
      }
    } catch (error) {
      throw error;
    }
  }

  static async downloadQuestion(questionId: string) {
    const response = await api.post(
      `${this.base}/files/${encodeURIComponent(questionId)}/download`,
      null,
      {
        responseType: "blob",
      },
    );
    return {
      blob: response.data as Blob,
      header: response.headers["content-disposition"],
    };
  }
  static async downloadQuestionFile(questionId: string, filename: string) {
    const response = await api.post(
      `${this.base}/files/${encodeURIComponent(
        questionId,
      )}/${encodeURIComponent(filename)}/download`,
      null,
      {
        responseType: "blob",
      },
    );

    return {
      blob: response.data as Blob,
      header: response.headers["content-disposition"],
    };
  }

  static async uploadQuestionZip(zipFile: File[]) {
    if (zipFile.length > 1) return;
    const file = zipFile[0];
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/upload_zip`, formData);
    return response.data;
  }
}
