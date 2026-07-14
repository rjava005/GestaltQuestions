import { createStore } from "zustand";

import type { QuestionTableState, QuestionTableStore } from "./types";

export function createQuestionTableStore(
  initial?: Partial<QuestionTableState>,
) {
  return createStore<QuestionTableStore>((set) => ({
    selectedIDs: [],
    visibleColumns: {},
    filters: {},
    search: "",
    limit: 50,
    offset: 0,
    ...initial,
    setSelectedIDs: (selectedIds) => set({ selectedIDs: selectedIds }),
    toggleSelectedId: (id) =>
      set((state) => ({
        selectedIDs: state.selectedIDs.includes(id)
          ? state.selectedIDs.filter((value) => value !== id)
          : [...state.selectedIDs, id],
      })),
    clearSelectedIds: () => set({ selectedIDs: [] }),
    setColumnVisible: (key, visible) =>
      set((state) => ({
        visibleColumns: {
          ...state.visibleColumns,
          [key]: visible,
        },
      })),
    toggleColumnVisible: (key) =>
      set((state) => ({
        visibleColumns: {
          ...state.visibleColumns,
          [key]: !(state.visibleColumns[key] ?? true),
        },
      })),
    setFilterValue: (key, value) =>
      set((state) => ({
        filters: {
          ...state.filters,
          [key]: value,
        },
        offset: 0,
      })),
    clearFilterValue: (key) =>
      set((state) => {
        const next = { ...state.filters };
        delete next[key];
        return { filters: next, offset: 0 };
      }),
    clearFilters: () => set({ filters: {}, offset: 0 }),
    setSearch: (search) => set({ search, offset: 0 }),
    setPagination: (next) =>
      set((state) => ({
        limit: next.limit ?? state.limit,
        offset: next.offset ?? state.offset,
      })),
  }));
}
