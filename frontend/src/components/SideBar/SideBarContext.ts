import { createContext, useContext } from "react";

export type SidebarContextValue<T = string> = {
  isOpen: boolean;
  selectedItem: T | null;
  setSelectedItem: (item: T) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const SidebarContext =
  createContext<SidebarContextValue<unknown> | null>(null);

export function useSideBar<T = string>() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSideBar must be used within SideBarMenu");
  }

  return context as SidebarContextValue<T>;
}
