import { FiDownload, FiTrash2, FiSend, FiUploadCloud } from "react-icons/fi";
import { type IconType } from "react-icons";

export type QuestionToolBar = {
  label: string;
  key: string;
  color: string;
  icon: IconType;
};

export const QuestionOptionsToolBar: QuestionToolBar[] = [
  {
    key: "download",
    label: "Download",
    color: `
      bg-slate-600 text-slate-800 hover:bg-slate-700
      dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600
    `,
    icon: FiDownload,
  },
  {
    key: "delete",
    label: "Delete",
    color: `
      bg-red-600 text-white hover:bg-red-700
      dark:bg-red-700 dark:text-white dark:hover:bg-red-600
    `,
    icon: FiTrash2,
  },
  {
    key: "submit_review",
    label: "Submit for Review",
    color: `
      bg-amber-500 text-amber-950 hover:bg-amber-600
      dark:bg-amber-600 dark:text-amber-50 dark:hover:bg-amber-500
    `,
    icon: FiSend,
  },
  {
    key: "publish",
    label: "Publish",
    color: `
      bg-green-600 text-white hover:bg-green-700
      dark:bg-green-700 dark:text-white dark:hover:bg-green-600
    `,
    icon: FiUploadCloud,
  },
];
