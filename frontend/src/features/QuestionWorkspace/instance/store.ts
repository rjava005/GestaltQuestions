import { createStore, useStore } from "zustand";

import type {
  QuestionWorkspaceActions,
  QuestionWorkspaceState,
  WorkspacePane,
} from "./types";

export type QuestionWorkspaceStore = QuestionWorkspaceState &
  QuestionWorkspaceActions;

const defaultPane: WorkspacePane = "livePreview";
const defaultActivePanes: WorkspacePane[] = [
  "livePreview",
  "editor",
  "metadata",
];

const initialState: QuestionWorkspaceState = {
  layoutMode: "split",
  activePanes: defaultActivePanes,
  selectedRuntimeLanguage: null,
  runtimeLanguages: [],
};

export function createQuestionWorkspaceStore(
  preloaded?: Partial<QuestionWorkspaceState>,
) {
  return createStore<QuestionWorkspaceStore>()((set) => ({
    ...initialState,
    ...preloaded,

    setLayoutMode: (mode) =>
      set((state) => ({
        layoutMode: mode,
        activePanes:
          mode === "single"
            ? [state.activePanes[0] ?? defaultPane]
            : state.activePanes.length
              ? state.activePanes
              : defaultActivePanes,
      })),

    setActivePanes: (panes) =>
      set({
        activePanes: panes.length ? panes : [defaultPane],
      }),

    togglePane: (pane) =>
      set((state) => {
        const nextPanes = state.activePanes.includes(pane)
          ? state.activePanes.filter((activePane) => activePane !== pane)
          : [...state.activePanes, pane];

        return {
          activePanes: nextPanes.length ? nextPanes : [defaultPane],
        };
      }),

    showSinglePane: (pane) =>
      set({
        layoutMode: "single",
        activePanes: [pane],
      }),

    setRuntimeLanguages: (languages) =>
      set((state) => ({
        runtimeLanguages: languages,
        selectedRuntimeLanguage:
          state.selectedRuntimeLanguage ?? languages[0] ?? null,
      })),

    setSelectedRuntimeLanguage: (language) =>
      set({ selectedRuntimeLanguage: language }),
  }));
}

const questionWorkspaceStore = createQuestionWorkspaceStore();

export function useQuestionWorkspaceStore<T>(
  selector: (state: QuestionWorkspaceStore) => T,
) {
  return useStore(questionWorkspaceStore, selector);
}
