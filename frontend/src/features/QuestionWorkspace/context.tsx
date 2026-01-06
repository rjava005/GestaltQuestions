import { createContext, useContext, useState } from "react";
import type { QuestionWorkspaceOptions } from "./types";

type QuestionWorkspaceContextValue = {
  option: QuestionWorkspaceOptions;
  setOption: React.Dispatch<React.SetStateAction<QuestionWorkspaceOptions>>;

  splitScreenPanes: QuestionWorkspaceOptions[];
  setSplitScreenPanes: React.Dispatch<
    React.SetStateAction<QuestionWorkspaceOptions[]>
  >;

  splitScreenEnabled: boolean;
  setSplitScreenEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

const QuestionWorkspaceContext = createContext<
  QuestionWorkspaceContextValue | undefined
>(undefined);

export function QuestionWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [option, setOption] = useState<QuestionWorkspaceOptions>("question");
  const [splitScreenPanes, setSplitScreenPanes] = useState<
    QuestionWorkspaceOptions[]
  >(["question"]);
  const [splitScreenEnabled, setSplitScreenEnabled] = useState<boolean>(false);

  return (
    <QuestionWorkspaceContext.Provider
      value={{
        option,
        setOption,
        splitScreenEnabled,
        setSplitScreenEnabled,
        splitScreenPanes,
        setSplitScreenPanes,
      }}
    >
      {children}
    </QuestionWorkspaceContext.Provider>
  );
}

export function useQuestionWorkspaceContext() {
  const context = useContext(QuestionWorkspaceContext);

  if (!context) {
    throw new Error(
      "useQuestionWorkspaceContext must be used within a QuestionWorkspaceProvider"
    );
  }

  return context;
}
