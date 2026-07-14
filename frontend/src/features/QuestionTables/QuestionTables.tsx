import { type PropsWithChildren, useMemo } from "react";

import type { QuestionTableRow } from "../../services";
import { QuestionTableBase } from "./components";
import QuestionTableToolBar from "./components/toolbar/QuestionTableToolBar";
import {
  createAllQuestionTableColumns,
  createMyQuestionTableColumns,
  type QuestionTableColumn,
} from "./config/columns";
import { useAllQuestions, useMyQuestions } from "./hooks/hooks";
import {
  QuestionTableProvider,
  useQuestionTableContext,
} from "./instance/context";
import { buildQuestionTableQuery } from "./utils/buildQuestionTableQuery";

export type QuestionTableViewProps = {
  onQuestionSelect?: (questionId: string) => void;
};

function useTableQuery(columns: QuestionTableColumn[]) {
  const searchTerm = useQuestionTableContext((s) => s.search);
  const rawFilters = useQuestionTableContext((s) => s.filters);

  return useMemo(
    () => buildQuestionTableQuery(columns, rawFilters, searchTerm),
    [columns, searchTerm, rawFilters],
  );
}

function QuestionTableLayout({
  columns,
  questions,
  showDelete,
  onQuestionSelect,
}: {
  columns: QuestionTableColumn[];
  questions: QuestionTableRow[];
  showDelete: boolean;
  onQuestionSelect?: (questionId: string) => void;
}) {
  return (
    <div className="flex h-dvh flex-col gap-4">
      <QuestionTableToolBar columns={columns} showDelete={showDelete} />
      <QuestionTableBase
        data={questions}
        getRowId={(question) => question.question_id}
        columns={columns}
        onQuestionSelect={onQuestionSelect}
      />
    </div>
  );
}

function AllQuestionsTableContent({
  onQuestionSelect,
}: QuestionTableViewProps) {
  const columns = useMemo(() => createAllQuestionTableColumns(), []);
  const query = useTableQuery(columns);
  const { questions } = useAllQuestions(query);

  return (
    <QuestionTableLayout
      columns={columns}
      questions={questions}
      showDelete={false}
      onQuestionSelect={onQuestionSelect}
    />
  );
}

function MyQuestionsTableContent({ onQuestionSelect }: QuestionTableViewProps) {
  const columns = useMemo(() => createMyQuestionTableColumns(), []);
  const query = useTableQuery(columns);
  const { questions } = useMyQuestions(query);

  return (
    <QuestionTableLayout
      columns={columns}
      questions={questions}
      showDelete
      onQuestionSelect={onQuestionSelect}
    />
  );
}

function QuestionTableStoreProvider({ children }: PropsWithChildren) {
  return (
    <QuestionTableProvider
      initialState={{
        limit: 25,
      }}
    >
      {children}
    </QuestionTableProvider>
  );
}

export function AllQuestionsTable(props: QuestionTableViewProps) {
  return (
    <QuestionTableStoreProvider>
      <AllQuestionsTableContent {...props} />
    </QuestionTableStoreProvider>
  );
}

export function MyQuestionsTable(props: QuestionTableViewProps) {
  return (
    <QuestionTableStoreProvider>
      <MyQuestionsTableContent {...props} />
    </QuestionTableStoreProvider>
  );
}
