import React, { createContext, useState, useContext } from "react";

type ServerSetting = "javascript" | "python";

type QuestionEngineContext = {
  serverSetting: ServerSetting;
  setServerSetting: React.Dispatch<React.SetStateAction<ServerSetting>>;

  solution: string;
  setSolution: React.Dispatch<React.SetStateAction<string>>;

  /** Whether to show the solution panel */
  showSolution: boolean;
  setShowSolution: React.Dispatch<React.SetStateAction<boolean>>;
};

export const QuestionEngineContext = createContext<QuestionEngineContext>({
  serverSetting: "javascript",
  setServerSetting: () => { },
  solution: "",
  setSolution: () => { },

  showSolution: false,
  setShowSolution: () => { },
});

const QuestionEngineProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [serverSetting, setServerSetting] =
    useState<ServerSetting>("javascript");
  const [solution, setSolution] = useState<string>("");
  const [showSolution, setShowSolution] = useState<boolean>(false);

  return (
    <QuestionEngineContext.Provider
      value={{
        serverSetting,
        setServerSetting,
        solution,
        setSolution,
        showSolution,
        setShowSolution,
      }}
    >
      {children}
    </QuestionEngineContext.Provider>
  );
};

export default QuestionEngineProvider;

export function useQuestionEngineContext() {
  const context = useContext(QuestionEngineContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedQuestion must be used within a SelectedQuestionProvider"
    );
  }
  return context;
}
