export type ThreadRead = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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

export type MessageCreate = {
  role: string;
  content: any;
};
