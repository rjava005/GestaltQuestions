import {
  type QuestionBuilderSection,
  useQuestionBuildingContext,
} from "./context";
import { type SectionItem, SectionToolBar } from "../../components/SectionTabs";

export const SectionItems: SectionItem<QuestionBuilderSection>[] = [
  { key: "question", label: "Question View" },
  { key: "code", label: "Code Editor" },
  { key: "metadata", label: "Metadata" },
  { key: "solution", label: "Solution" },
] as const;

export function QuestionEditorSections() {
  const { section, setSection } = useQuestionBuildingContext();
  return (
    <div>
      <SectionToolBar
        options={SectionItems}
        selected={section}
        setSelected={(val) => setSection(val as QuestionBuilderSection)}
      />
    </div>
  );
}
