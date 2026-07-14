import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";

import { createQuestionTableStore } from "./store";
import type { QuestionTableState, QuestionTableStore } from "./types";

type QuestionTableStoreApi = ReturnType<typeof createQuestionTableStore>;
const QuestionTableContext = createContext<QuestionTableStoreApi | null>(null);
type QuestionTableProviderProps = {
  children: ReactNode;
  initialState?: Partial<QuestionTableState>;
};
export function QuestionTableProvider({
  children,
  initialState,
}: QuestionTableProviderProps) {
  const storeRef = useRef<QuestionTableStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createQuestionTableStore(initialState);
  }

  return (
    <QuestionTableContext.Provider value={storeRef.current}>
      {children}
    </QuestionTableContext.Provider>
  );
}
export function useQuestionTableContext<T>(
  selector: (state: QuestionTableStore) => T,
): T {
  const store = useContext(QuestionTableContext);

  if (!store) {
    throw new Error(
      "useQuestionTableContext must be used inside QuestionTableProvider",
    );
  }

  return useStore(store, selector);
}

// type DevTableStore = QuestionTableStore<QuestionRead>;
// type AllTableStore = QuestionTableStore<QuestionAllRow>;

// const DevTableContext = createContext<StoreApi<DevTableStore> | null>(null);
// const AllTableContext = createContext<StoreApi<AllTableStore> | null>(null);

// export function DevTableProvider({
//   children,
//   initialState,
// }: {
//   children: ReactNode;
//   initialState?: Partial<QuestionTableState<QuestionRead>>;
// }) {
//   const storeRef = useRef<StoreApi<DevTableStore> | null>(null);

//   if (!storeRef.current) {
//     storeRef.current = createQuestionTableStore<QuestionRead>(initialState);
//   }

//   return (
//     <DevTableContext.Provider value={storeRef.current}>
//       {children}
//     </DevTableContext.Provider>
//   );
// }

// export function AllTableProvider({
//   children,
//   initialState,
// }: {
//   children: ReactNode;
//   initialState?: Partial<QuestionTableState<QuestionAllRow>>;
// }) {
//   const storeRef = useRef<StoreApi<AllTableStore> | null>(null);

//   if (!storeRef.current) {
//     storeRef.current = createQuestionTableStore<QuestionAllRow>(initialState);
//   }

//   return (
//     <AllTableContext.Provider value={storeRef.current}>
//       {children}
//     </AllTableContext.Provider>
//   );
// }

// export function useDevTableContext<T>(
//   selector: (state: DevTableStore) => T,
// ): T {
//   const store = useContext(DevTableContext);
//   if (!store) {
//     throw new Error("useDevTableContext must be used within DevTableProvider");
//   }
//   return useStore(store, selector);
// }

// export function useAllTableContext<T>(
//   selector: (state: AllTableStore) => T,
// ): T {
//   const store = useContext(AllTableContext);
//   if (!store) {
//     throw new Error("useAllTableContext must be used within AllTableProvider");
//   }
//   return useStore(store, selector);
// }
