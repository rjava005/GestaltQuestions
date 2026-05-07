import type React from "react";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  header?: string;
  children?: React.ReactNode;
};

export default function Container({ header, children }: ContainerProps) {
  return (
    <section
      className="
        w-full rounded-lg border border-border
        bg-surface-strong p-5 shadow-(--shadow-soft)
        transition-all duration-(--duration-base) ease-base
      "
    >
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-text tracking-tight">
          {header}
        </h1>
        <div className="mt-2 h-px w-full bg-border-strong" />
      </div>

      <div className="text-text-muted">{children}</div>
    </section>
  );
}
