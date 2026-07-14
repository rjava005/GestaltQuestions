import type { QuestionTableColumn } from "../../config/columns";
import { useQuestionTableContext } from "../../instance/context";

type QuestionTableColumnVisibilityProps = {
  columns: QuestionTableColumn[];
};

export function QuestionTableColumnVisibility({
  columns,
}: QuestionTableColumnVisibilityProps) {
  const visibleColumns = useQuestionTableContext((s) => s.visibleColumns);
  const setColumnVisible = useQuestionTableContext((s) => s.setColumnVisible);

  return (
    <fieldset className="rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-xl">
      <legend className="px-1 text-xs font-semibold uppercase text-slate-400">
        Columns
      </legend>

      <div className="flex flex-col gap-2">
        {columns.map((column) => {
          const key = String(column.key);
          const isVisible =
            visibleColumns[key] ?? column.defaultVisible ?? false;

          return (
            <label
              key={key}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-900"
            >
              <span>{column.label}</span>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(event) =>
                  setColumnVisible(key, event.target.checked)
                }
                className="h-4 w-4 accent-blue-500"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
