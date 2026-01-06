import React, { createContext, useContext, useState, useCallback } from "react";

// --- Types ---
type AnswerValue = string | number | string[];
type AnswersMap = Record<string, AnswerValue>;

interface QuestionRuntimeContextType {
  /** All current answers keyed by input name */
  answers: AnswersMap;
  /** Update or add a new answer */
  setAnswer: (name: string, value: AnswerValue) => void;
}

// --- Context ---
const QuestionRuntimeContext = createContext<QuestionRuntimeContextType | null>(null);

// --- Provider ---
export const QuestionRuntimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [answers, setAnswers] = useState<AnswersMap>({});

  const setAnswer = useCallback((name: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [name]: value }));
  }, []);

  return (
    <QuestionRuntimeContext.Provider
      value={{ answers, setAnswer }}
    >
      {children}
    </QuestionRuntimeContext.Provider>
  );
};

// --- Hook ---
export const useQuestionRuntime = (): QuestionRuntimeContextType => {
  const ctx = useContext(QuestionRuntimeContext);
  if (!ctx) {
    throw new Error("useQuestionRuntime must be used within a QuestionRuntimeProvider");
  }
  return ctx;
};
