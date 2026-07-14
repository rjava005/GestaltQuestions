import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type QuestionMetadataSectionProps = {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
};

export function QuestionMetadataSection({
  title,
  icon: Icon,
  children,
}: QuestionMetadataSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-surface/80 p-4">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
        <h3 className="text-base font-semibold text-text">{title}</h3>
      </div>
      {children}
    </section>
  );
}
