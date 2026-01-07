export type FileActions = "save" | "upload" | "delete" | "download";

export type FileOptions = {
  questionID: string | null;
  filename?: string;
  fileContent?: string;
};
