import type { QuestionCreate } from "../../../types/questionTypes";

export type CreateMode = "blank" | "upload";

export type FileType = "html" | "javascript" | "python";

export type Filenames =
  | "question.html"
  | "solution.html"
  | "server.js"
  | "server.py";

type FileTemplate = {
  adaptive: boolean;
  template: string;
};

export type QuestionFileSpec = {
  filename: Filenames;
  type: FileType;
  required: boolean;
  description: string;
  isAdaptive: boolean;
  template: FileTemplate[];
};

export type QuestionCreationState = {
  defaultFiles: Filenames[];
  uploadedFiles: File[] | null;
  questionIsAdaptive: boolean;
  questionData: QuestionCreate | null;
  fileDrafts: Partial<Record<Filenames, string>>;
};

export type QuestionCreationActions = {
  setDefaultFiles: (files: Filenames[]) => void;
  addDefaultFile: (file: Filenames) => void;
  removeDefaultFile: (file: Filenames) => void;

  setUploadedFiles: (files: File[]) => void;
  removeUploadedFile: (file: File) => void;
  removeUploadedFileByIndex: (index: number) => void;
  setIsAdaptive: (value: boolean) => void;
  setQuestionData: (payload: Partial<QuestionCreate>) => void;
  setFileDraft: (filename: Filenames, content: string) => void;
};

export type QuestionCreationStore = QuestionCreationState &
  QuestionCreationActions;
