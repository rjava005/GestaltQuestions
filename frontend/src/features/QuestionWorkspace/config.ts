import { type QuestionWorkspaceOptions } from "./types";
import { type SectionItem } from "../../components/SectionTabs";
export const QuestionBuilderSectionLabels: Record<
  QuestionWorkspaceOptions,
  string
> = {
  question: "Question View",
  code: "Code Editor",
  metadata: "Question Metadata",
  solution: "Question Solution",
};

export const SectionItems: SectionItem<QuestionWorkspaceOptions>[] = [
  { key: "question", label: "Question View" },
  { key: "code", label: "Code Editor" },
  { key: "metadata", label: "Metadata" },
  { key: "solution", label: "Solution" },
] as const;
