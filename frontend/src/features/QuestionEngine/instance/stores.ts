import { createStore } from "zustand";

import type { QuestionInstanceState, QuestionInstanceStore } from "./types";

export function createQuestionInstanceStore(
  initialState?: Partial<QuestionInstanceState>,
) {
  return createStore<QuestionInstanceStore>()((set) => ({
    answers: {},
    hasSubmitted: false,
    refreshKey: 0,
    showSolution: false,
    ...initialState,

    setRunTimeContent: (payload) =>
      set(() => ({
        ...payload,
        hasSubmitted: false,
        answers: {},
      })),
    setRefreshKey: () =>
      set((state) => {
        const circuitVariant = state.quiz_data?.params.circuitVariant;
        const previousCircuitVariant =
          circuitVariant === "lowPass" || circuitVariant === "highPass"
            ? circuitVariant
            : undefined;
        return {
          refreshKey: state.refreshKey + 1,
          previousCircuitVariant,
        };
      }),
    setAnswer: (name, value) =>
      set((state) => ({
        answers: { ...state.answers, [name]: value },
      })),
    resetAnswers: () => set(() => ({ answers: {} })),
    submitAnswers: () => set(() => ({ hasSubmitted: true })),
    resetSubmissions: () => set(() => ({ hasSubmitted: false })),
    setShowSolution: () =>
      set((state) => ({ showSolution: !state.showSolution })),
  }));
}
