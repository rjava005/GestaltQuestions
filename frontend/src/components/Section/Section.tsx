import clsx from "clsx";

type SectionVariant = "hero" | "primary" | "questionBuilder";

const SectionTheme: Record<SectionVariant, string> = {
  hero: "min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300",
  primary:
    "min-h-screen px-5 py-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors duration-300",
  questionBuilder:
    "min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300",
};

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  className?: string;
  variant?: SectionVariant;
};

export default function Section({
  id,
  children,
  className,
  variant,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={clsx(variant ? SectionTheme[variant] : "", className)}
      {...rest}
    >
      {children}
    </section>
  );
}
