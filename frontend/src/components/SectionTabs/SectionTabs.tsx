import clsx from "clsx";

export type SectionItem<K extends string = string> = {
  key: K;
  label: string;
};
export type SectionTabProps = SectionItem & {
  selected: boolean;
  setSelected: (val: string) => void;
  onClick?: () => void;
};

export default function SectionTab({
  label,
  selected,
  setSelected,
}: SectionTabProps) {
  return (
    <button
      type="button"
      onClick={() => setSelected(label)}
      className={clsx(
        "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "focus:ring-offset-white dark:focus:ring-offset-slate-900",

        selected
          ? "text-blue-700 dark:text-blue-400"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
      )}
    >
      {label}
    </button>
  );
}
