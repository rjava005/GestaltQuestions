import { createStore } from "zustand";

import { QuestionRuntimeApi } from "../../../services/QuestionRuntime";
import type { QuestionInstanceState, QuestionInstanceStore } from "./types";

export function createQuestionInstanceStore(
  initialState?: Partial<QuestionInstanceState>,
) {
  return createStore<QuestionInstanceStore>()((set, getState) => ({
    answers: {},
    hasSubmitted: false,
    refreshKey: 0,
    showSolution: false,
    isGrading: false,
    ...initialState,

    setRunTimeContent: (payload) =>
      set(() => ({
        ...payload,
        hasSubmitted: false,
        answers: {},
        grading: undefined,
        gradingError: undefined,
        isGrading: false,
        showSolution: false,
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
    submitAnswers: async () => {
      const state = getState();
      const secure = state.quiz_data?.secure_grading === true;
      if (!secure) {
        set(() => ({ hasSubmitted: true }));
        return;
      }
      if (!state.qmeta?.id || !state.instance) {
        set(() => ({
          gradingError: "Secure question instance is unavailable.",
        }));
        return;
      }
      set(() => ({ isGrading: true, gradingError: undefined }));
      try {
        const grading = await QuestionRuntimeApi.gradeQuestion(
          String(state.qmeta.id),
          state.instance,
          state.answers,
        );
        set(() => ({
          grading,
          solution_html: grading.solution_html ?? state.solution_html,
          hasSubmitted: grading.status === "correct",
          isGrading: false,
        }));
      } catch (error) {
        set(() => ({
          gradingError: error instanceof Error ? error.message : String(error),
          isGrading: false,
        }));
      }
    },
    resetSubmissions: () =>
      set(() => ({
        hasSubmitted: false,
        grading: undefined,
        gradingError: undefined,
      })),
    setShowSolution: () =>
      set((state) => ({ showSolution: !state.showSolution })),
  }));
}
