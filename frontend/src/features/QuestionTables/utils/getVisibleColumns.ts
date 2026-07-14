import type { TableColumn } from "../../../components/Table";

export function getVisibleColumns<T, V extends string, TQuery>(
  columns: TableColumn<T, V, TQuery>[],
  visibleColumns: Record<string, boolean>,
) {
  return columns.filter((column) => {
    const key = String(column.key);
    return visibleColumns[key] ?? column.defaultVisible ?? false;
  });
}
