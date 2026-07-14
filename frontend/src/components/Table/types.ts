export type RowId = string;

export type ColumnFilterKind =
  | "select"
  | "multiSelect"
  | "text"
  | "dateRange"
  | "booleanToggle";

type TableColumnKey<T, V extends string = never> = Extract<keyof T, string> | V;

export type TableColumn<T, V extends string = never, TQuery = unknown> = {
  key: TableColumnKey<T, V>;
  label?: string;
  defaultVisible?: boolean;
  hideable?: boolean;
  render?: (
    row: T,
    onSelect?: () => void,
    isSelected?: boolean,
    className?: string,
  ) => React.ReactNode;
  filter?: {
    kind: ColumnFilterKind;
    label?: string;
    options?: { label: string; value: string }[];
    show?: boolean;
    toQuery?: (value: unknown) => Partial<TQuery>;
  };
};
