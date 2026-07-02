import clsx from "clsx";
import type React from "react";

export type SidebarFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SidebarFooter({
  children,
  className,
}: SidebarFooterProps) {
  return (
    <footer
      className={clsx(
        "sticky bottom-0 mt-auto flex flex-col gap-1 border-t border-border bg-surface px-0 py-2",
        className,
      )}
    >
      {children}
    </footer>
  );
}
