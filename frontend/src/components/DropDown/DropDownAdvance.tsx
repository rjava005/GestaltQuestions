import { type DropDownBase } from "./types";
import { type IconType } from "react-icons";
import { useState, useRef } from "react";
import clsx from "clsx";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";

export type DropDownAdvanceOption = {
  value: string;
  label: string;
  icon?: IconType;
};
type DropDownAdvanceProps = DropDownBase & {
  options: DropDownAdvanceOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function DropDownAdvance({
  options,
  selected,
  setSelected,
  label,
  open: controlledOpen,
  onOpenChange,
}: DropDownAdvanceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  };

  useOnClickOutside(containerRef, () => {
    if (open) setOpen(false);
  });

  const selectedOption = options.find((o) => o.value === selected);
  const SelectedIcon = selectedOption?.icon;

  return (
    <div ref={containerRef} className="relative w-full">
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
                  // setOpen(false);
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
