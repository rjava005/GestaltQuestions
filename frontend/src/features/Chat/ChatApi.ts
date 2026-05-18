import api from "../../services/client";

export type ThreadRead = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type MessageCreate = {
  role: string;
  content: any;
};

export type ThreadMessageDetails = {
  thread: ThreadRead;
  db_messages: Array<{
    id: string;
    thread_id: string;
    role: string;
    content: any;
    created_at: string;
  }>;
  langgraph_messages: any[];
};

export default class ChatApi {
  private static readonly base = "/threads";

  private static authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  static async createThreadId(
    token: string,
    threadId: string,
  ): Promise<ThreadRead> {
    try {
      const response = await api.post<ThreadRead>(
        `${this.base}/${threadId}/`,
        {},
        {
          headers: this.authHeaders(token),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create thread id", error);
      throw error;
    }
  }

  static async getUserThreads(token: string): Promise<ThreadRead[]> {
    try {
      const response = await api.get<ThreadRead[]>(`${this.base}/`, {
        headers: this.authHeaders(token),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get user threads", error);
      throw error;
    }
  }

  static async getUserThreadMessages(
    token: string,
    threadId: string,
  ): Promise<ThreadMessageDetails> {
    try {
      const response = await api.get<ThreadMessageDetails>(
        `${this.base}/${threadId}/details`,
        {
          headers: this.authHeaders(token),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get thread details/messages", error);
      throw error;
    }
  }

  static async createMessage(
    threadId: string | null,
    message: MessageCreate[],
  ) {
    try {
      if (!threadId) return;
      const response = await api.post(
        `${this.base}/${threadId}/messages`,
        message,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create message", error);
      throw error;
    }
  }
}
