import { type QuestionWorkspaceOptions } from "./types";
import { useQuestionWorkspaceContext } from "./context";
import { type SectionItem, SectionToolBar } from "../../components/SectionTabs";

export const SectionItems: SectionItem<QuestionWorkspaceOptions>[] = [
  { key: "question", label: "Question View" },
  { key: "code", label: "Code Editor" },
  { key: "metadata", label: "Metadata" },
  { key: "solution", label: "Solution" },
] as const;

export function QuestionEditorSections() {
  const { option, setOption } = useQuestionWorkspaceContext();
  return (
    <div>
      <SectionToolBar
        options={SectionItems}
        selected={option}
        setSelected={(val) => setOption(val as QuestionWorkspaceOptions)}
      />
    </div>
  );
}
