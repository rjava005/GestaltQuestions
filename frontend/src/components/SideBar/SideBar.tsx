import clsx from "clsx";
import type { ComponentType } from "react";

import { SideBarItem, type SideBarItem as SideBarOption } from "./SideBarItem";

export type SideBarProps = {
  options: SideBarOption[];
  selected: string;
  setSelected: (val: string) => void;
  show?: boolean;
  maxHeightClassName?: string;
  className?: string;
  toolbar?: ComponentType;
};

export function SideBar({
  options,
  selected,
  setSelected,
  show = true,
  maxHeightClassName = "max-h-[560px]",
  className,
  toolbar: Toolbar,
}: SideBarProps) {
  if (!show) return null;

  return (
    <aside
      className={clsx(
        "w-72 rounded-lg border border-border bg-surface p-2 shadow-soft",
        className,
      )}
    >
      {Toolbar ? (
        <div className="mb-2 border-b border-border pb-2">
          <Toolbar />
        </div>
      ) : null}
      <div
        className={clsx(
          "auto-scroll-y flex flex-col gap-1 overflow-y-auto pr-1",
          maxHeightClassName,
        )}
      >
        {options.length > 0 ? (
          options.map((v) => (
            <SideBarItem
              label={v.label}
              key={v.key}
              icon={v.icon}
              onSelect={() => setSelected(v.key)}
              selected={v.key === selected}
            />
          ))
        ) : (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-text-soft">
            No items available
          </div>
        )}
      </div>
    </aside>
  );
}

export default SideBar;
