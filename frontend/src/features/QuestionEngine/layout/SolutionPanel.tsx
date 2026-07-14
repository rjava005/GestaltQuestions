import type React from "react";

type SolutionPanelProps = {
  children: React.ReactNode;
};

export default function SolutionPanel({ children }: SolutionPanelProps) {
  return (
    <section className="h-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[linear-gradient(135deg,rgba(21,28,40,0.96),rgba(12,22,42,0.86))] p-6 text-[var(--color-text)] shadow-[var(--shadow-soft)]">
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
        Solution
      </h2>
      {children}
    </section>
  );
}
