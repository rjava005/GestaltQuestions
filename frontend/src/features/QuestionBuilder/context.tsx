import React, { createContext, useContext, useState } from "react";

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

export const QuestionBuilderProvider = ({
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

export function useQuestionBuildingContext() {
  const context = useContext(QuestionBuilderContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedQuestion must be used within a SelectedQuestionProvider"
    );
  }
  return context;
}

/* =======================
   Types & Constants
======================= */

export type QuestionCollectionView =
  | "all"
  | "current"
  | "drafts"
  | "published"
  | "archived"
  | "create";

export const QuestionCollectionViewLabels: Record<
  QuestionCollectionView,
  string
> = {
  all: "All Questions",
  current: "Current",
  drafts: "Drafts",
  published: "Published",
  archived: "Archived",
  create: "Create Question",
};

/* =======================
   Context Definition
======================= */

type QuestionCollectionViewContextType = {
  view: QuestionCollectionView;
  setView: React.Dispatch<React.SetStateAction<QuestionCollectionView>>;
};

export const QuestionCollectionViewContext =
  createContext<QuestionCollectionViewContextType>({
    view: "all",
    setView: () => {},
  });

/* =======================
   Provider
======================= */

export const QuestionCollectionViewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [view, setView] = useState<QuestionCollectionView>("current");

  return (
    <QuestionCollectionViewContext.Provider value={{ view, setView }}>
      {children}
    </QuestionCollectionViewContext.Provider>
  );
};

/* =======================
   Hook
======================= */

export function useQuestionCollectionViewContext() {
  const context = useContext(QuestionCollectionViewContext);
  if (!context) {
    throw new Error(
      "useQuestionCollectionViewContext must be used within a QuestionCollectionViewProvider"
    );
  }
  return context;
}
