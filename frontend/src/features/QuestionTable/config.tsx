import clsx from "clsx";
import type { QuestionData, QuestionMeta } from "../../types/questionTypes";
import type { TableColumn } from "./types";
import { BiSelectMultiple } from "react-icons/bi";
import { IoMdDownload } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { IoSettings } from "react-icons/io5";
import { FaSyncAlt } from "react-icons/fa";
import { type ToolBarItem } from "./types";

export const QuestionTableColumns: TableColumn<QuestionData>[] =
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
        return q.topics;
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
      render: (q) => q.languages,
    },
    {
      key: "storage_path",
      label: "Storage Path",
      default: true,
      render: (q) => (
        <code className="text-xs opacity-70">{q.question_path}</code>
      ),
    },
    {
      key: "status",
      label: "Status",
      default: false,
      render: (q) => (
        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
          {q.status}
        </span>
      ),
    },
    {
      key: "qtypes",
      label: "Question Type",
      default: false,
      render: (q) => q.qtypes
    },
  ];

export const ToolBarItems: ToolBarItem<
  TableColumn<QuestionData | QuestionMeta>
>[] = [
    {
      label: "Multi-Select",
      action: "TOGGLE_MULTI_SELECT",
      icon: BiSelectMultiple,
      kind: "button",
    },
    {
      label: "Download",
      action: "DOWNLOAD",
      icon: IoMdDownload,
      multiSelect: true,
      kind: "button",
    },
    {
      label: "Delete Question",
      action: "DELETE",
      icon: MdDelete,
      multiSelect: true,
      kind: "button",
    },
    {
      label: "Sync",
      action: "SYNC",
      icon: FaSyncAlt,
      kind: "button",
    },
    {
      label: "Table Settings",
      action: "TABLE_SETTINGS",
      icon: IoSettings,
      kind: "dropdown",
      items: QuestionTableColumns,
    },
  ];
