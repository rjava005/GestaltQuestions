import { useEffect, useMemo, useState } from "react";
import { FaFilter } from "react-icons/fa";

import type { TableColumn } from "../../../../components/Table";
import { useQuestionTableContext } from "../../instance/context";

type TableHeaderProps<
  T,
  V extends string = never,
> = React.ComponentPropsWithoutRef<"thead"> & {
  columns: TableColumn<T, V>[];
};

type ColumnFilterControlProps<T, V extends string = never> = {
  column: TableColumn<T, V>;
};

type MultiSelectFilterControlProps = {
  columnKey: string;
  label: string;
  options: { label: string; value: string }[];
  selectedValues: string[];
  setFilterValue: (key: string, value: unknown) => void;
  clearFilterValue: (key: string) => void;
};

function MultiSelectFilterControl({
  columnKey,
  label,
  options,
  selectedValues,
  setFilterValue,
  clearFilterValue,
}: MultiSelectFilterControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingValues, setPendingValues] = useState<string[]>(selectedValues);
  const selectedValuesKey = selectedValues.join("\u0000");

  useEffect(() => {
    if (!isOpen) setPendingValues(selectedValues);
  }, [isOpen, selectedValuesKey]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, search]);

  const togglePendingValue = (optionValue: string) => {
    setPendingValues((current) =>
      current.includes(optionValue)
        ? current.filter((value) => value !== optionValue)
        : [...current, optionValue],
    );
  };

  const clearValues = () => {
    setPendingValues([]);
    clearFilterValue(columnKey);
    setIsOpen(false);
  };

  const applyValues = () => {
    if (pendingValues.length > 0) setFilterValue(columnKey, pendingValues);
    else clearFilterValue(columnKey);
    setIsOpen(false);
  };

  return (
    <div className="relative mt-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={label}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 text-xs font-semibold normal-case tracking-normal text-text transition hover:border-accent hover:bg-surface-muted"
        onClick={() => {
          setPendingValues(selectedValues);
          setIsOpen((open) => !open);
        }}
      >
        <FaFilter aria-hidden="true" />
        <span>
          {selectedValues.length
            ? `${selectedValues.length} selected`
            : "Filter"}
        </span>
      </button>
      {isOpen ? (
        <div className="absolute left-0 z-20 mt-2 w-72 rounded-lg border border-border-strong bg-surface-strong p-4 text-left normal-case tracking-normal text-text shadow-soft">
          <input
            aria-label={`Search ${label}`}
            className="mb-3 h-10 w-full rounded-md border border-border bg-bg px-3 text-sm font-normal text-text outline-none transition placeholder:text-text-tertiary focus:border-accent"
            placeholder="Search options..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="max-h-48 space-y-2 overflow-auto">
            {filteredOptions.map((option) => {
              const checked = pendingValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={checked}
                    onChange={() => togglePendingValue(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2 border-t border-border pt-3">
            <button
              type="button"
              className="flex-1 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm font-semibold text-text transition hover:bg-surface-muted"
              onClick={clearValues}
            >
              Clear
            </button>
            <button
              type="button"
              className="flex-1 rounded-md border border-accent bg-accent px-3 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
              onClick={applyValues}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ColumnFilterControl<T, V extends string = never>({
  column,
}: ColumnFilterControlProps<T, V>) {
  const filter = column.filter;
  const columnKey = String(column.key);
  const value = useQuestionTableContext((state) => state.filters[columnKey]);
  const setFilterValue = useQuestionTableContext(
    (state) => state.setFilterValue,
  );
  const clearFilterValue = useQuestionTableContext(
    (state) => state.clearFilterValue,
  );

  if (!filter) return null;

  const label = filter.label ?? `Filter ${column.label ?? columnKey}`;
  const inputClassName =
    "mt-2 h-9 w-full rounded-md border border-border bg-surface-secondary px-2.5 text-xs font-medium normal-case tracking-normal text-text outline-none transition hover:border-border-strong focus:border-accent focus:bg-surface";

  switch (filter.kind) {
    case "select":
      return (
        <select
          aria-label={label}
          className={inputClassName}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => {
            const nextValue = event.target.value;
            setFilterValue(columnKey, nextValue);
          }}
        >
          <option value="">All</option>
          {filter.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "multiSelect": {
      const selectedValues = Array.isArray(value) ? value.map(String) : [];

      return (
        <MultiSelectFilterControl
          columnKey={columnKey}
          label={label}
          options={filter.options ?? []}
          selectedValues={selectedValues}
          setFilterValue={setFilterValue}
          clearFilterValue={clearFilterValue}
        />
      );
    }
    case "text":
      return (
        <input
          aria-label={label}
          className={inputClassName}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue) setFilterValue(columnKey, nextValue);
            else clearFilterValue(columnKey);
          }}
        />
      );
    case "booleanToggle": {
      const selectedValue = typeof value === "boolean" ? value : null;
      const options = [
        { label: "Adaptive", value: true },
        { label: "Static", value: false },
      ];

      return (
        <div className="mt-2 inline-flex rounded-md border border-border bg-surface-secondary p-1 normal-case tracking-normal">
          {options.map((option) => {
            const isSelected = selectedValue === option.value;

            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isSelected}
                className={
                  isSelected
                    ? "rounded px-2.5 py-1.5 text-xs font-semibold text-bg bg-accent"
                    : "rounded px-2.5 py-1.5 text-xs font-semibold text-text-muted transition hover:bg-surface-muted hover:text-text"
                }
                onClick={() => {
                  if (isSelected) clearFilterValue(columnKey);
                  else setFilterValue(columnKey, option.value);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    }
    case "dateRange": {
      const range =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as { from?: string; to?: string })
          : {};

      const updateRange = (nextRange: { from?: string; to?: string }) => {
        if (nextRange.from || nextRange.to)
          setFilterValue(columnKey, nextRange);
        else clearFilterValue(columnKey);
      };

      return (
        <div className="mt-2 flex gap-2">
          <input
            aria-label={`${label} from`}
            className={inputClassName}
            type="date"
            value={range.from ?? ""}
            onChange={(event) =>
              updateRange({ ...range, from: event.target.value || undefined })
            }
          />
          <input
            aria-label={`${label} to`}
            className={inputClassName}
            type="date"
            value={range.to ?? ""}
            onChange={(event) =>
              updateRange({ ...range, to: event.target.value || undefined })
            }
          />
        </div>
      );
    }
  }
}

export default function TableHeader<T, V extends string = never>({
  columns,
  className,
  ...props
}: TableHeaderProps<T, V>) {
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  return (
    <thead className={className} {...props}>
      <tr className="bg-surface-strong/95">
        {columns.map((column) => {
          const columnKey = String(column.key);
          const isFilterOpen = openFilterKey === columnKey;
          const shouldShowFilter = column.filter?.show ?? true;
          const hasVisibleFilter = Boolean(column.filter && shouldShowFilter);

          return (
            <th
              key={columnKey}
              className="min-w-44 border-b border-border-strong px-4 py-3 text-left align-top text-xs font-semibold uppercase tracking-wide text-text-muted"
            >
              <div className="flex min-h-6 items-center gap-2">
                {hasVisibleFilter ? (
                  <button
                    type="button"
                    aria-label={`${isFilterOpen ? "Hide" : "Show"} filter for ${
                      column.label ?? columnKey
                    }`}
                    aria-expanded={isFilterOpen}
                    className={
                      isFilterOpen
                        ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-accent bg-accent text-bg shadow-sm transition hover:opacity-90"
                        : "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-secondary text-text-muted transition hover:border-accent hover:bg-surface-muted hover:text-accent"
                    }
                    onClick={() =>
                      setOpenFilterKey((currentKey) =>
                        currentKey === columnKey ? null : columnKey,
                      )
                    }
                  >
                    <FaFilter aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <span className="min-w-0 truncate">
                  {column.label ?? columnKey}
                </span>
              </div>
              {isFilterOpen && hasVisibleFilter ? (
                <div className="min-w-52 max-w-72">
                  <ColumnFilterControl column={column} />
                </div>
              ) : null}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
