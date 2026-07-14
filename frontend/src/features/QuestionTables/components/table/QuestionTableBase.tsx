import { useMemo, useState } from "react";

import {
  type RowId,
  Table,
  TableBody,
  type TableColumn,
  TableContainer,
  TableFooter,
} from "../../../../components/Table";
import { useQuestionTableContext } from "../../instance/context";
import { getVisibleColumns } from "../../utils/getVisibleColumns";
import TableHeader from "./TableHeader";

type QuestionTableProps<T, V extends string = never> = {
  data: T[];
  columns: TableColumn<T, V>[];
  getRowId: (row: T) => RowId;
  onQuestionSelect?: (questionId: RowId) => void;
};

export default function QuestionTable<T, V extends string = never>({
  data,
  columns,
  getRowId,
  onQuestionSelect,
}: QuestionTableProps<T, V>) {
  // Get the global state of the columns
  const visibleColumns = useQuestionTableContext(
    (state) => state.visibleColumns,
  );
  // Resolves the columsn based on the column config. Global state comes first->default visibility-> false
  const resolvedColumns = useMemo(() => {
    return getVisibleColumns(columns, visibleColumns);
  }, [columns, visibleColumns]);

  // Get all selected ids
  const selectedIDs = useQuestionTableContext((state) => state.selectedIDs);
  const setSelectedIDs = useQuestionTableContext(
    (state) => state.setSelectedIDs,
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const currentPageRows = useMemo(
    () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, page, rowsPerPage],
  );

  const from = total === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(total, (page + 1) * rowsPerPage);

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number.parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <TableContainer>
        <Table aria-label="question-table">
          <TableHeader columns={resolvedColumns} />
          <TableBody
            rows={currentPageRows}
            columns={resolvedColumns}
            getRowId={getRowId}
            selectedIDs={selectedIDs}
            setSelectedIDs={setSelectedIDs}
            onQuestionSelect={onQuestionSelect}
          />
        </Table>
      </TableContainer>

      <TableFooter
        from={from}
        to={to}
        total={total}
        page={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        onPreviousPage={() => setPage((p) => Math.max(0, p - 1))}
        onNextPage={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
      />
    </>
  );
}
