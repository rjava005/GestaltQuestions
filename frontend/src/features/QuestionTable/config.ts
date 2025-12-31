import type { QuestionData } from "../../types/questionTypes";

type ColumnKey = keyof QuestionData | "select";
type TableColumn = {
  key: ColumnKey;
  label: string;
};

export const QuestionTableColumns: TableColumn[] = [
  { key: "select", label: "Select" },
  { key: "title", label: "Question Title" },
  { key: "topics", label: "Topics" },
  { key: "isAdaptive", label: "Adaptive" },
  { key: "ai_generated", label: "AI Gen" },
  { key: "languages", label: "Languages" },
  { key: "storage_path", label: "Storage Path" },
  { key: "status", label: "Status" },
];
