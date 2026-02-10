export type CreateMode = "blank" | "upload" | "text-ai" | "image-ai";

export type Filenames =
  | "question.html"
  | "solution.html"
  | "server.js"
  | "server.py";

//   File Template to handle adaptive and non adaptive cases
type FileTemplate = {
  adaptive: boolean;
  template: string;
};
export type QuestionFileSpec = {
  filename: Filenames;
  required: boolean;
  description: string;
  isAdaptive: boolean;
  template: FileTemplate[];
};
