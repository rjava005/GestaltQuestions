import type { ReactNode } from "react";

export function ApprovalCardContainer({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden max-w-[85%]">
      {children}
    </div>
  );
}
