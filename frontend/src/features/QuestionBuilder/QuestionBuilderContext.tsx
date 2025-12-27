import React, { createContext, useContext, useState } from "react";
import { CodeEditorContex } from "../../context/CodeEditorContext";


export type QuestionBuilderSection =
  | "question"
  | "code"
  | "metadata"
  | "solution";

export const QuestionBuilderSectionLabels: Record<
  QuestionBuilderSection,
  string
> = {
  question: "Question View",
  code: "Code Editor",
  metadata: "Question Metadata",
  solution: "Question Solution",
};

type QuestionBuilderContext = {
  section: QuestionBuilderSection;
  setSection: React.Dispatch<React.SetStateAction<QuestionBuilderSection>>;
};

export const QuestionBuilderContext = createContext<QuestionBuilderContext>({
  section: "question",
  setSection: () => {},
});

const QuestionBuilderProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [section, setSection] = useState<QuestionBuilderSection>("question");
  return (
    <QuestionBuilderContext
      value={{
        section,
        setSection,
      }}
    >
      {children}
    </QuestionBuilderContext>
  );
};

export default QuestionBuilderProvider;

export function useQuestionBuildingContext() {
  const context = useContext(CodeEditorContex);
  if (context === undefined) {
    throw new Error(
      "useSelectedQuestion must be used within a SelectedQuestionProvider"
    );
  }
  return context;
}
