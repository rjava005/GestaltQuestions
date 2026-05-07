export type QuestionStatus =
  | "archived"
  | "draft"
  | "published"
  | "ARCHIVED"
  | "DRAFT"
  | "PUBLISHED";

export type QuestionRead = {
  id: string;
  title: string | null;
  ai_generated: boolean;
  isAdaptive: boolean;
  storage_path: string | null;
  storage_type: string;
  status: QuestionStatus;
  created_by_id: string | null;
  topics: string[];
  qTypes: string[];
};

export type QuestionAllRow = {
  title: string;
  question_id: string;
  isAdaptive: boolean;
  ai_generated: boolean;
  status: QuestionStatus;
  user_id: string;
  created_by: string;
  institution: string;
};

export type QuestionCreate = {
  id?: string | null;
  title: string;
  ai_generated?: boolean;
  isAdaptive?: boolean;
  topics?: string[];
  qTypes?: string[];
};

export type QuestionUpdate = {
  title?: string;
  ai_generated?: boolean;
  isAdaptive?: boolean;
  topics?: string[];
  qTypes?: string[];
};

export type QuestionFilter = {
  title?: string;
};

export type QuestionFileList = string[];
export type QuestionDeleteResponse = boolean;
