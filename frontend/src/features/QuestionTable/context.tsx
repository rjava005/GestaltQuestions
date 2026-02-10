import { createContext, useContext, useState, type ReactNode } from "react";
import { type TableColumn } from "./types";
import type { QuestionData } from "../../types/questionTypes";

type QuestionTableContextType = {
  multiSelect: boolean;
  setMultiSelect: React.Dispatch<React.SetStateAction<boolean>>;
  resetKey: number;
  setResetKey: React.Dispatch<React.SetStateAction<number>>;
  columns: TableColumn<QuestionData>[];
  setColumns: React.Dispatch<
    React.SetStateAction<TableColumn<QuestionData>[]>
  >;
};

export const QuestionTableContext =
  createContext<QuestionTableContextType | null>(null);

export function QuestionTableProvider({ children }: { children: ReactNode }) {
  const [multiSelect, setMultiSelect] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [columns, setColumns] = useState<
    TableColumn<QuestionData>[]
  >([]);

  return (
    <QuestionTableContext.Provider
      value={{
        multiSelect,
        setMultiSelect,
        resetKey,
        setResetKey,
        columns,
        setColumns,
      }}
    >
      {children}
    </QuestionTableContext.Provider>
  );
}

export function useQuestionTableContext() {
  const context = useContext(QuestionTableContext);

  if (!context) {
    throw new Error(
      "useQuestionCollectionContext must be used within a <QuestionProvider>"
    );
  }

  return context;
}
