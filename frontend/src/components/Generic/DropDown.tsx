import { useCallback, useState } from "react";
import type { IconType } from "react-icons/lib";
import clsx from "clsx";
type DropDownBase = {
  selected: string;
  setSelected: (val: string) => void;
  label: string;
};
export type DropDownAdvanceOption = {
  value: string;
  label: string;
  icon?: IconType;
};
type DropDownAdvanceProps = DropDownBase & {
  options: DropDownAdvanceOption[];
};

type DropDownProps = DropDownBase & {
  options: string[];
};

export function DropDown({
  options,
  selected,
  setSelected,
  label = "Drop Down",
}: DropDownProps) {
  const handleDropDownChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelected(event.target.value);
    },
    [setSelected]
  );

  return (
    <div className="w-full flex flex-col gap-1">
      <label htmlFor="dropDown" className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        id="dropDown"
        name="dropDown"
        value={selected}
        onChange={handleDropDownChange}
        className="
          w-full rounded-md border border-slate-300 bg-white
          px-3 py-2 text-sm text-slate-800
          focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500
          hover:border-slate-400
        "
      >
        {options.map((v) => {
          const cleaned = v.trim();
          return (
            <option key={cleaned} value={cleaned}>
              {cleaned}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function DropDownAdvance({
  options,
  selected,
  setSelected,
  label,
}: DropDownAdvanceProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === selected);
  const SelectedIcon = selectedOption?.icon;

  return (
    <div className="relative w-full">
      <label className="block mb-1 text-sm font-medium text-slate-700">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-full flex items-center justify-between gap-2
          rounded-md border border-slate-300 bg-white
          px-3 py-2 text-sm
          hover:border-slate-400
          focus:outline-none focus:ring-2 focus:ring-violet-500
        "
      >
        <span className="flex items-center gap-2">
          {SelectedIcon && <SelectedIcon className="size-8" />}
          {selectedOption?.label}
        </span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSelected(opt.value);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full px-3 py-2 flex items-center gap-2 text-sm text-left hover:bg-slate-100",
                  opt.value === selected && "bg-slate-100 font-medium"
                )}
              >
                {Icon && <Icon className="size-5" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
