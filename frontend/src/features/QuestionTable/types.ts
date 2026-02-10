import { type IconType } from "react-icons";
// The keys for the actual columns used in the table

type UIColumnKey = "select" | "actions";
export type TableColumn<T> = {
  key: keyof T | UIColumnKey;
  label: string;
  default: boolean;
  render?: (row: T, className?: string) => React.ReactNode;
};

// Types for the toolbar actions
export type ToolBarAction =
  | "TOGGLE_MULTI_SELECT"
  | "DOWNLOAD"
  | "DELETE"
  | "SYNC"
  | "TABLE_SETTINGS";

export type ToolBarItemBase = {
  label: string;
  action: ToolBarAction;
  icon?: IconType;
  multiSelect?: boolean; // Only trigger if multiselect is activate
};

export type ToolBarDropdownItem<T> = {
  key: keyof T | string;
  label: string;
  default: boolean;
};

// The drop down items is for the
// Selection of the fields to add to the table
export type ToolBarItem<T> =
  | (ToolBarItemBase & {
      kind: "button";
    })
  | (ToolBarItemBase & {
      kind: "dropdown";
      items: ToolBarDropdownItem<T>[];
    });
