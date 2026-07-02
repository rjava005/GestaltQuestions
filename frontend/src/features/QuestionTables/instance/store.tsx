import { createStore } from "zustand";

import type { QuestionTableState, QuestionTableStore } from "./types";

const baseInitialState = {
  questions: [],
  multiselect: true,
  selectedIDs: [],
};

export function createQuestionTableStore<TQuestion>(
  preloaded?: Partial<QuestionTableState<TQuestion>>,
) {
  return createStore<QuestionTableStore<TQuestion>>()((set) => ({
    ...baseInitialState,
    ...preloaded,

    setMultiSelect: (val) => set({ multiselect: val }),

    setSelectedIDs: (ids) => set({ selectedIDs: ids }),

    setQuestions: (qs) => set({ questions: qs }),
  }));
}
