// Handle the state of the table
type TableFilterValues = Record<string, unknown>;
type TableColumnVisibility = Record<string, boolean>;

export type QuestionTableState = {
  selectedIDs: string[];
  visibleColumns: TableColumnVisibility;
  filters: TableFilterValues;
  search: string;
  limit: number;
  offset: number;
};

export type QuestionTableBaseActions = {
  setSelectedIDs: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;
  clearSelectedIds: () => void;

  setColumnVisible: (key: string, visible: boolean) => void;
  toggleColumnVisible: (key: string) => void;

  setFilterValue: (key: string, value: unknown) => void;
  clearFilterValue: (key: string) => void;
  clearFilters: () => void;
  setSearch: (value: string) => void;
  setPagination: (next: { limit?: number; offset?: number }) => void;
};

export type QuestionTableStore = QuestionTableState & QuestionTableBaseActions;

// export type QuestionTableActions<TQuestion> = QuestionTableBaseActions & {
//   setQuestions: (qs: TQuestion[]) => void;
// };

// export type AllQuestionTActions = QuestionTableActions<QuestionAllRow>;
// export type QuestionTableStore<TQuestion> = QuestionTableState<TQuestion> &
//   QuestionTableActions<TQuestion>;
