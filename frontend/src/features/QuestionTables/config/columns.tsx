import type { TableColumn } from "../../../components/Table";
import type {
  QuestionRuntimeLanguage,
  QuestionTableRow,
  QuestionTableSearchParams,
} from "../../../services";
import {
  QUESTION_STATUS_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  QUESTION_TYPE_VALUES,
  type QuestionStatus,
} from "../../../types/questionTypes";
import { AllowedInstitutions, type ValidInstitutions } from "../../Auth/types";
import {
  QuestionAdaptiveCell,
  QuestionCreatedAtCell,
  QuestionCreatedByCell,
  QuestionInstitutionCell,
  QuestionRuntimesCell,
  QuestionSelectCell,
  QuestionStatusCell,
  QuestionTitleCell,
  QuestionTopicsCell,
  QuestionTypesCell,
} from "../components/cells";

type FilterOption<T extends string> = { label: string; value: T };

const RUNTIME_OPTIONS = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
] satisfies FilterOption<QuestionRuntimeLanguage>[];
const RUNTIME_VALUES = RUNTIME_OPTIONS.map(
  (option) => option.value,
) as QuestionRuntimeLanguage[];

const INSTITUTION_OPTIONS = AllowedInstitutions.map((institution) => ({
  label: institution,
  value: institution,
})) satisfies FilterOption<ValidInstitutions>[];

function selectedOptions<T extends string>(
  value: unknown,
  validValues: readonly T[],
): T[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  return values.filter((item): item is T => validValues.includes(item as T));
}

export type QuestionTableVirtualKey = "select";
export type QuestionTableColumn = TableColumn<
  QuestionTableRow,
  QuestionTableVirtualKey,
  QuestionTableSearchParams
>;
type QuestionColumnKey = keyof QuestionTableRow | QuestionTableVirtualKey;
type ExcludedColumns = QuestionColumnKey[];
export function createBaseQuestionTableColumns(): QuestionTableColumn[] {
  return [
    {
      key: "select",
      label: "Select",
      defaultVisible: true,
      render: (row, onSelect, isSelected) => (
        <QuestionSelectCell
          row={row}
          checked={isSelected}
          onSelect={onSelect}
        />
      ),
    },
    {
      key: "title",
      label: "Title",
      defaultVisible: true,
      render: (row, onSelect, isSelected) => (
        <QuestionTitleCell
          row={row}
          isSelected={isSelected ?? false}
          onSelect={onSelect ? onSelect : () => {}}
        />
      ),
    },
    {
      key: "isAdaptive",
      label: "Adaptive",
      render: (row) => <QuestionAdaptiveCell row={row} />,
      filter: {
        kind: "booleanToggle",
        label: "Filter adaptive questions",
        toQuery: (value) => ({
          isAdaptive: typeof value === "boolean" ? value : null,
        }),
      },
    },
    {
      key: "status",
      label: "Status",
      defaultVisible: true,
      render: (row) => <QuestionStatusCell row={row} />,
      filter: {
        kind: "select",
        label: "filter-select",
        options: QUESTION_STATUS_OPTIONS,
        toQuery: (value) => ({
          status: QUESTION_STATUS_OPTIONS.some(
            (option) => option.value === value,
          )
            ? (value as QuestionStatus)
            : null,
        }),
      },
    },
    {
      key: "topics",
      label: "Topics",
      render: (row) => <QuestionTopicsCell row={row} />,
      filter: {
        kind: "text",
        label: "Filter topics",
        toQuery: (value) => ({
          topic:
            typeof value === "string" && value.trim() ? value.trim() : null,
        }),
      },
    },
    {
      key: "question_type",
      label: "Type",
      render: (row) => <QuestionTypesCell row={row} />,
      filter: {
        kind: "multiSelect",
        label: "Filter question type",
        options: QUESTION_TYPE_OPTIONS,
        toQuery: (value) => ({
          qtype: selectedOptions(value, QUESTION_TYPE_VALUES),
        }),
      },
    },
    {
      key: "available_runtimes",
      label: "Runtimes",
      defaultVisible: true,
      render: (row) => <QuestionRuntimesCell row={row} />,
      filter: {
        kind: "multiSelect",
        label: "Filter runtimes",
        options: RUNTIME_OPTIONS,
        toQuery: (value) => ({
          language: selectedOptions(value, RUNTIME_VALUES),
        }),
      },
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => <QuestionCreatedAtCell row={row} />,
    },
  ];
}

export function createMyQuestionTableColumns(): QuestionTableColumn[] {
  return createBaseQuestionTableColumns();
}

export function createAllQuestionTableColumns(): QuestionTableColumn[] {
  let baseColumns = createBaseQuestionTableColumns();
  const excludedCol: ExcludedColumns = ["status"];
  const columns = baseColumns.map((column) =>
    excludedCol.includes(column.key)
      ? {
          ...column,
          defaultVisible: true,
          filter: column.filter ? { ...column.filter, show: false } : undefined,
        }
      : column,
  );
  return [
    ...columns,
    {
      key: "institution",
      label: "Institution",
      render: (row) => <QuestionInstitutionCell row={row} />,
      filter: {
        kind: "select",
        label: "Filter institution",
        options: INSTITUTION_OPTIONS,
        toQuery: (value) => ({
          institution: AllowedInstitutions.includes(value as ValidInstitutions)
            ? (value as ValidInstitutions)
            : null,
        }),
      },
    },
    {
      key: "created_by",
      label: "Created By",
      render: (row) => <QuestionCreatedByCell row={row} />,
    },
  ];
}
