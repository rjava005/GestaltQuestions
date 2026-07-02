import { createContext, type ReactNode, useContext, useRef } from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";

import { createQuestionStore } from "./store";
import type { QuestionCreationState, QuestionCreationStore } from "./types";

const QuestionCreateContext =
  createContext<StoreApi<QuestionCreationStore> | null>(null);

export function QuestionCreateProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<QuestionCreationState>;
}) {
  const storeRef = useRef<StoreApi<QuestionCreationStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createQuestionStore(initialState);
  }
  return (
    <QuestionCreateContext.Provider value={storeRef.current}>
      {children}
    </QuestionCreateContext.Provider>
  );
}

export function useQuestionCreate<T>(
  selector: (state: QuestionCreationStore) => T,
): T {
  const store = useContext(QuestionCreateContext);
  if (!store)
    throw new Error(
      "useQuestionCreate must be used within QuestionCreateProvider",
    );
  return useStore(store, selector);
}
