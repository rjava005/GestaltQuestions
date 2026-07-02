import clsx from "clsx";
import React from "react";

export type SideBarContentProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SideBarContent({
  children,
  className,
}: SideBarContentProps) {
  return (
    <div
      className={clsx(
        "my-2 flex min-h-0 flex-1 flex-col gap-1 border-y border-border py-2 overflow-y-auto overflow-x-clip",
        className,
      )}
    >
      {children}
    </div>
  );
}
