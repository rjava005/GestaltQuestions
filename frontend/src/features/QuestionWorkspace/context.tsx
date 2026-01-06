import { createContext, useContext, useState } from "react";
import type { QuestionWorkspaceOptions } from "./types";

type QuestionWorkspaceContextValue = {
  option: QuestionWorkspaceOptions;
  setOption: React.Dispatch<React.SetStateAction<QuestionWorkspaceOptions>>;
};

const QuestionWorkspaceContext =
  createContext<QuestionWorkspaceContextValue | undefined>(undefined);

export function QuestionWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [option, setOption] = useState<QuestionWorkspaceOptions>("question");

  return (
    <QuestionWorkspaceContext.Provider
      value={{
        option,
        setOption,
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
