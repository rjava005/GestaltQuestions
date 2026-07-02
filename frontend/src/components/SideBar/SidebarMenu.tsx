import clsx from "clsx";
import React, { useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { GiHamburgerMenu } from "react-icons/gi";

import SideBarContent from "./SideBarContent";
import { SidebarContext, type SidebarContextValue } from "./SideBarContext";
import SidebarFooter from "./SidebarFooter";
import SideBarHeader from "./SideBarHeader";
import SidebarMenuItem from "./SidebarMenuItem";

type SidebarSize = "sm" | "md" | "lg" | "xl";
type SidebarHeight = "auto" | "stretch" | "screen" | "sticky";
const sidebarHeights: Record<SidebarHeight, string> = {
  auto: "h-auto",
  stretch: "self-stretch",
  screen: "min-h-screen",
  sticky: "sticky top-0 max-h-screen overflow-y-auto",
};
const sidebarSizes: Record<SidebarSize, string> = {
  sm: "w-56",
  md: "w-72",
  lg: "w-80",
  xl: "w-96",
};

type SidebarProps<T = string> = {
  children?: React.ReactNode;
  Icon?: IconType;
  width?: SidebarSize;
  height?: SidebarHeight;
  defaultOpen?: boolean;
  defaultSelectedItem?: T | null;
  headerName?: string;
  header?: React.ReactNode;
};

function SideBarMenuRoot<T = string>({
  width = "md",
  height = "stretch",
  Icon = GiHamburgerMenu,
  defaultOpen = false,
  defaultSelectedItem = null,
  children,
  headerName,
  header,
}: SidebarProps<T>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedItem, setSelectedItem] = useState<T | null>(
    defaultSelectedItem,
  );

  const value = useMemo<SidebarContextValue<T>>(
    () => ({
      isOpen,
      selectedItem,
      setSelectedItem,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
    }),
    [isOpen, selectedItem],
  );

  const defaultHeader = (
    <SideBarHeader
      title={headerName ?? ""}
      Icon={Icon}
      isOpen={value.isOpen}
      toggle={value.toggle}
    />
  );

  return (
    <SidebarContext.Provider value={value as SidebarContextValue<unknown>}>
      <aside
        className={clsx(
          isOpen ? sidebarSizes[width] : "w-16",
          sidebarHeights[height],
          "flex flex-col shrink-0 self-stretch border-l border-border bg-surface text-text shadow-soft transition-all duration-200 ease-in-out",
        )}
      >
        {header ?? defaultHeader}
        {isOpen && children}
      </aside>
    </SidebarContext.Provider>
  );
}

const SideBarMenu = Object.assign(SideBarMenuRoot, {
  Content: SideBarContent,
  Footer: SidebarFooter,
  Item: SidebarMenuItem,
  Header: SideBarHeader,
});

export default SideBarMenu;
