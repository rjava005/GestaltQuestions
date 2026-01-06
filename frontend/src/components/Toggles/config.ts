import { type ToggleVariant } from "./types";

export const toggleStyles: Record<
  ToggleVariant,
  {
    container: string;
    input: string;
    label: string;
  }
> = {
  base: {
    container:
      "flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-150 hover:text-blue-600 dark:hover:text-blue-400",
    input:
      "h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800",
    label: "",
  },

  compact: {
    container:
      "flex items-center gap-1 cursor-pointer select-none text-xs font-medium text-gray-600 dark:text-gray-400",
    input:
      "h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500",
    label: "",
  },

  emphasis: {
    container:
      "flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
    input:
      "h-4 w-4 rounded border-blue-400 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 dark:focus:ring-offset-gray-800",
    label: "tracking-wide",
  },
};
