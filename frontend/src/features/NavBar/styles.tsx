import clsx from "clsx";


export type LinkVariant = "default" | "accent" | "ghost";
export const linkStyles: Record<LinkVariant, string> = {
    default: clsx(
        "block px-3 py-2 rounded-md text-sm",
        "text-white dark:text-gray-100",
        "hover:bg-gray-100 dark:hover:bg-white/10"
    ),

    accent: clsx(
        "block px-3 py-2 rounded-md text-sm font-semibold",
        "bg-indigo-600 text-white",
        "hover:bg-indigo-500",
        "dark:bg-indigo-500 dark:hover:bg-indigo-400"
    ),

    ghost: clsx(
        "block px-3 py-2 rounded-md text-sm",
        "text-gray-600 dark:text-gray-400",
        "hover:text-gray-900 dark:hover:text-white",
        "hover:bg-gray-50 dark:hover:bg-white/5"
    ),
};