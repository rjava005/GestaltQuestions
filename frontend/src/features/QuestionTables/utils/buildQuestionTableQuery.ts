import type { QuestionTableSearchParams } from "../../../services";
import type { QuestionTableColumn } from "../config/columns";

export function buildQuestionTableQuery(
  columns: QuestionTableColumn[],
  rawFilters: Record<string, unknown>,
  search: string,
): QuestionTableSearchParams {
  return columns.reduce<QuestionTableSearchParams>(
    (params, column) => {
      const value = rawFilters[String(column.key)];
      if (column.filter?.toQuery) {
        Object.assign(params, column.filter.toQuery(value));
      }
      return params;
    },
    { search },
  );
}
