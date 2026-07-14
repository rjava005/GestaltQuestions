import { createContext, type ReactNode, useContext, useRef } from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";

import { createQuestionInstanceStore } from "./stores";
import type { QuestionInstanceState, QuestionInstanceStore } from "./types";

const QuestionInstanceContext =
  createContext<StoreApi<QuestionInstanceStore> | null>(null);

export function QuestionInstanceProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<QuestionInstanceState>;
}) {
  const storeRef = useRef<StoreApi<QuestionInstanceStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createQuestionInstanceStore(initialState);
  }

  return (
    <QuestionInstanceContext.Provider value={storeRef.current}>
      {children}
    </QuestionInstanceContext.Provider>
  );
}

export function useQuestionInstance<T>(
  selector: (state: QuestionInstanceStore) => T,
): T {
  const store = useContext(QuestionInstanceContext);
  if (!store)
    throw new Error(
      "useQuestionInstance must be used within QuestionInstanceProvider",
    );
  return useStore(store, selector);
}
