import clsx from "clsx";
import type { ComponentType } from "react";
import type { IconType } from "react-icons";

import { useSideBar } from "./SideBarContext";

// Actions for extending functionality
export type SidebarMenuItemAction<T> = {
  label: string;
  icon: IconType;
  onClick: (item: T) => void;
};
export type SidebarMenuItemProps<T = string> = {
  item: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: SidebarMenuItemAction<T>[];
  className?: string;
  onSelect?: (item: T) => void;
};

export default function SidebarMenuItem<T = string>({
  item,
  label,
  icon: Icon,
  actions,
  className,
  onSelect,
}: SidebarMenuItemProps<T>) {
  const { isOpen, selectedItem, setSelectedItem } = useSideBar<T>();
  const selected = Object.is(selectedItem, item);

  function handleSelect() {
    setSelectedItem(item);
    onSelect?.(item);
  }

  return (
    <div className="group flex w-full items-center gap-1 px-3">
      <button
        type="button"
        title={!isOpen ? label : undefined}
        onClick={handleSelect}
        className={clsx(
          "relative flex h-12.5 min-w-0 flex-1 shrink-0 items-center rounded-md border text-left transition-colors",
          isOpen ? "gap-3 px-3" : "justify-center px-0",
          "focus:outline-none focus:ring-2 focus:ring-accent/60",
          selected
            ? "border-border-strong bg-surface-strong text-text shadow-soft"
            : "border-transparent bg-transparent text-text-muted hover:border-border hover:bg-surface-muted hover:text-text",
          className,
        )}
      >
        {selected && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-accent" />
        )}

        {Icon && (
          <Icon
            className={clsx(
              "h-5 w-5 shrink-0 transition-colors",
              selected
                ? "text-accent"
                : "text-text-soft group-hover:text-text-muted",
            )}
          />
        )}

        {isOpen && (
          <span className="truncate text-base font-medium">{label}</span>
        )}
      </button>

      {/* Render the actions */}
      {isOpen && actions?.length ? (
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {actions.map((action) => {
            const ActionIcon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                title={action.label}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onClick(item);
                }}
                className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-accent/60"
              >
                <ActionIcon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
