import React, {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import type { QuestionData } from "../types/questionTypes";

type QuestionCollectionContext = {
  selectedQuestionID: string | null;
  setSelectedQuestionID: React.Dispatch<React.SetStateAction<string>>;
  questionMeta: QuestionData | null;
  setQuestionMeta: React.Dispatch<React.SetStateAction<QuestionData | null>>;
  selectedQuestions: string[];
  setSelectedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  questions: QuestionData[];
  setQuestions: Dispatch<React.SetStateAction<QuestionData[]>>;
};

export const QuestionContext = createContext<QuestionCollectionContext | null>(
  null
);

export function QuestionCollectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [questionMeta, setQuestionMeta] = useState<QuestionData | null>(null);

  const [selectedQuestionID, setSelectedQuestionID] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  return (
    <QuestionContext.Provider
      value={{
        questions,
        setQuestions,
        selectedQuestionID,
        setSelectedQuestionID,
        questionMeta,
        setQuestionMeta,
        selectedQuestions,
        setSelectedQuestions,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
}

export function useQuestionCollectionContext() {
  const context = useContext(QuestionContext);

  if (!context) {
    throw new Error(
      "useQuestionCollectionContext must be used within a <QuestionProvider>"
    );
  }

  return context;
}
