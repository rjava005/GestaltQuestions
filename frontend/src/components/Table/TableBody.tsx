import type { RowId, TableColumn } from "./types";

type TableBodyProps<
  T,
  V extends string = never,
> = React.ComponentPropsWithRef<"tbody"> & {
  rows: T[];
  columns: TableColumn<T, V>[];
  getRowId: (row: T) => RowId;
  selectedIDs: string[];
  setSelectedIDs: (val: string[]) => void;
  onQuestionSelect?: (questionId: RowId) => void;
};

export function TableBody<T, V extends string = never>({
  rows,
  columns,
  getRowId,
  className,
  selectedIDs,
  setSelectedIDs,
  onQuestionSelect,
  ...props
}: TableBodyProps<T, V>) {
  return (
    <tbody className={className} {...props}>
      {rows.length === 0 && (
        <tr>
          <td
            className="px-4 py-8 text-center text-sm text-text-muted"
            colSpan={columns.length}
          >
            No questions found.
          </td>
        </tr>
      )}

      {rows.map((row) => {
        const rowKey = getRowId(row);

        return (
          <tr
            key={rowKey}
            className="border-b border-border/70 last:border-b-0 hover:bg-surface-muted/60"
          >
            {columns.map((column) => {
              const columnKey = String(column.key);

              if (columnKey === "title") {
                return (
                  <td
                    key={`${rowKey}-${columnKey}`}
                    className="px-4 py-3 text-sm text-text"
                  >
                    {column.render
                      ? column.render(row, () => onQuestionSelect?.(rowKey))
                      : null}
                  </td>
                );
              }
              if (columnKey === "select") {
                const onSelect = () => {
                  const nextSelectedIDs = selectedIDs.includes(rowKey)
                    ? selectedIDs.filter((id) => id !== rowKey)
                    : [...selectedIDs, rowKey];

                  setSelectedIDs(nextSelectedIDs);
                };
                const isChecked = selectedIDs.includes(rowKey);
                return (
                  <td
                    key={`${rowKey}-${columnKey}`}
                    className="px-4 py-3 text-sm text-text"
                  >
                    {column.render
                      ? column.render(row, onSelect, isChecked)
                      : null}
                  </td>
                );
              }
              return (
                <td
                  key={`${rowKey}-${columnKey}`}
                  className="px-4 py-3 text-sm text-text"
                >
                  {column.render ? column.render(row) : null}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}
