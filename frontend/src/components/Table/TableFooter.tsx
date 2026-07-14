type TableFooterProps = {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  rowsPerPage: number;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function TableFooter({
  from,
  to,
  total,
  page,
  totalPages,
  rowsPerPage,
  onRowsPerPageChange,
  onPreviousPage,
  onNextPage,
}: TableFooterProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-text-muted">
      <div>
        {from}-{to} of {total}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="rowsPerPage">Rows:</label>
        <select
          id="rowsPerPage"
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text outline-none focus:border-accent"
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>

        <button
          type="button"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onPreviousPage}
          disabled={page === 0}
        >
          Previous
        </button>

        <span>
          {page + 1} / {totalPages}
        </span>

        <button
          type="button"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onNextPage}
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
