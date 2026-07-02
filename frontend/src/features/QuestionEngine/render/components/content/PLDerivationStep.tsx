import clsx from "clsx";

export interface PLDerivationStepProps {
  children?: React.ReactNode;
  className?: string;
}

export function PLDerivationStep({
  children,
  className,
}: PLDerivationStepProps) {
  return (
    <div
      className={clsx(
        "p-4 rounded-md shadow-sm leading-relaxed text-[15px] border-l-4 border-accent bg-surface-muted text-text",
        className,
      )}
    >
      {children}
    </div>
  );
}
