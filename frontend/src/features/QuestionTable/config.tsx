import type {
  QuestionData,
  QuestionMeta,
  questionRel,
} from "../../types/questionTypes";
import clsx from "clsx";


type ColumnKey = keyof QuestionData | "select";
type TableColumn<T> = {
  key: ColumnKey;
  label: string;
  default: boolean;
  render?: (row: T, className?: string) => React.ReactNode;
};

function isRelArray(value: unknown): value is questionRel[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    "name" in value[0]
  );
}
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && (value.length === 0 || typeof value === "string")
  );
}
function formatRelationshipField(value?: string[] | questionRel[]): string {
  if (!value || value.length === 0) return "-";

  if (isStringArray(value)) {
    return value.join(", ");
  }
  if (isRelArray(value)) {
    return value.map((v) => v.name).join(", ");
  }
  return "—";
}

export const QuestionTableColumns: TableColumn<QuestionData | QuestionMeta>[] =
  [
    {
      key: "select",
      label: "Select",
      default: true,
      render: () => <input type="checkbox" />,
    },
    {
      key: "title",
      label: "Question ,Title",
      default: true,
      render: (q, className) => (
        <span
          className={clsx(
            "font-medium cursor-pointer select-none transition-all duration-300 ease-in-out",
            className
          )}
        >
          {q.title}
        </span>
      ),
    },
    {
      key: "topics",
      label: "Topics",
      default: false,
      render: (q) => {
        return formatRelationshipField(q.topics) ?? "-";
      },
    },
    {
      key: "isAdaptive",
      label: "Adaptive",
      default: true,
      render: (q) => (
        <span
          className={clsx(
            "px-2 py-1 rounded-full text-xs font-semibold",
            q.isAdaptive
              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          {q.isAdaptive ? "Adaptive" : "Non-Adaptive"}
        </span>
      ),
    },
    {
      key: "ai_generated",
      label: "AI Gen",
      default: false,
      render: (q) => (q.ai_generated ? "Yes" : "No"),
    },
    {
      key: "languages",
      label: "Languages",
      default: false,
      render: (q) => formatRelationshipField(q.languages) ?? "-",
    },
    {
      key: "storage_path",
      label: "Storage Path",
      default: false,
      render: (q) => (
        <code className="text-xs opacity-70">{q.storage_path}</code>
      ),
    },
    {
      key: "status",
      label: "Status",
      default: true,
      render: (q) => (
        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
          {q.status}
        </span>
      ),
    },
  ];

