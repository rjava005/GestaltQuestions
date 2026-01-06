import type { IconType } from "react-icons";

export type ToolBarItem<T> = {
  key: T;
  label: string;
  color?: string;
  icon?: IconType;
};
