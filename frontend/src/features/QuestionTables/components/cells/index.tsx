import type { QuestionTableRow } from "../../../../services";
import { styles } from "../styles";

type SelectCellProps = {
  row: QuestionTableRow;
  checked?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
};

export function QuestionSelectCell({
  row,
  checked = false,
  onSelect,
}: SelectCellProps) {
  return (
    <input
      type="checkbox"
      className={styles.checkbox}
      checked={checked}
      onChange={(event) => onSelect?.(row.question_id, event.target.checked)}
    />
  );
}

type TitleCellProps = {
  row: QuestionTableRow;
  isSelected: boolean;
  onSelect: () => void;
};

export function QuestionTitleCell({
  row,
  isSelected,
  onSelect,
}: TitleCellProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect()}
      className={
        isSelected
          ? "font-semibold text-accent underline"
          : "text-text hover:text-accent"
      }
    >
      {row.title ?? "Untitled"}
    </button>
  );
}

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type StatusDisplayConfig = {
  label: string;
  dotClassName: string;
  textClassName: string;
};

const STATUS_DISPLAY_CONFIG: Record<string, StatusDisplayConfig> = {
  published: {
    label: "Published",
    dotClassName: "bg-emerald-400",
    textClassName: "text-emerald-100",
  },
  draft: {
    label: "Draft",
    dotClassName: "bg-slate-500",
    textClassName: "text-slate-300",
  },
  archived: {
    label: "Archived",
    dotClassName: "bg-amber-400",
    textClassName: "text-amber-100",
  },
};

export function QuestionStatusCell({ row }: { row: QuestionTableRow }) {
  const status = String(row.status ?? "").toLowerCase();
  const statusConfig = STATUS_DISPLAY_CONFIG[status] ?? {
    label: formatStatusLabel(status || "unknown"),
    dotClassName: "bg-slate-500",
    textClassName: "text-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${statusConfig.textClassName}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${statusConfig.dotClassName}`}
      />
      {statusConfig.label}
    </span>
  );
}

export function QuestionAdaptiveCell({ row }: { row: QuestionTableRow }) {
  const isAdaptive = row.isAdaptive === true;

  return (
    <span
      className={
        isAdaptive
          ? "inline-flex items-center rounded-full border border-approval-border bg-approval-muted px-2.5 py-1 text-xs font-semibold text-approval"
          : "inline-flex items-center rounded-full border border-border-strong bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-soft"
      }
    >
      {isAdaptive ? "Adaptive" : "Static"}
    </span>
  );
}

export function QuestionTopicsCell({ row }: { row: QuestionTableRow }) {
  return <span>{row.topics.length ? row.topics.join(", ") : "—"}</span>;
}

export function QuestionTypesCell({ row }: { row: QuestionTableRow }) {
  return (
    <span>{row.question_type.length ? row.question_type.join(", ") : "—"}</span>
  );
}

export function QuestionRuntimesCell({ row }: { row: QuestionTableRow }) {
  return (
    <span>
      {row.available_runtimes.length ? row.available_runtimes.join(", ") : "—"}
    </span>
  );
}

export function QuestionCreatedAtCell({ row }: { row: QuestionTableRow }) {
  return <span>{new Date(row.created_at).toLocaleDateString()}</span>;
}

export function QuestionInstitutionCell({ row }: { row: QuestionTableRow }) {
  return <span>{row.institution || "—"}</span>;
}

export function QuestionCreatedByCell({ row }: { row: QuestionTableRow }) {
  return <span>{row.created_by || "—"}</span>;
}
