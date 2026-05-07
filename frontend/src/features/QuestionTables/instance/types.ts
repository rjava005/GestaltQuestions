export type RowId = string;
import type { QuestionAllRow } from "../../QuestionBuilder";

export type TableColumn = {
  key: string;
  render?: (
    row: { id?: string | null | undefined },
    className?: string,
  ) => React.ReactNode;
};

type QuestionTableBaseState = {
  selectedIDs: string[];
  multiselect: boolean;
};

type QuestionTableBaseActions = {
  setSelectedIDs: (ids: string[]) => void;
  setMultiSelect: (val: boolean) => void;
};

export type QuestionTableState<TQuestion> = QuestionTableBaseState & {
  questions: TQuestion[];
};

export type QuestionTableActions<TQuestion> = QuestionTableBaseActions & {
  setQuestions: (qs: TQuestion[]) => void;
};

export type AllQuestionTActions = QuestionTableActions<QuestionAllRow>;
export type QuestionTableStore<TQuestion> = QuestionTableState<TQuestion> &
  QuestionTableActions<TQuestion>;
