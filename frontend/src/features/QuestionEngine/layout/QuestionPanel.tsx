import type React from "react";

type QuestionPanelProps = {
  children: React.ReactNode;
};

export default function QuestionPanel({ children }: QuestionPanelProps) {
  return (
    <section className="h-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-[var(--color-text)] shadow-[var(--shadow-soft)]">
      {children}
    </section>
  );
}
