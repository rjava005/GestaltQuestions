import clsx from "clsx";
import type React from "react";

type HeaderStyle = "Generic" | "QuestionBuilder" | "Authentication";

type HeaderStyleConfig = {
  wrapper: string;
  title: string;
};

const styles: Record<HeaderStyle, HeaderStyleConfig> = {
  Generic: {
    wrapper: "w-full",
    title: "truncate text-2xl font-bold tracking-tight text-text",
  },
  Authentication: {
    wrapper: "flex flex-col items-center text-center space-y-1 text-text",
    title: "text-xl font-semibold tracking-tight text-text",
  },

  QuestionBuilder: {
    wrapper:
      "w-full flex flex-col rounded-lg border border-border bg-surface px-6 py-4",
    title: "truncate mb-4 text-3xl font-semibold tracking-tight text-text",
  },
};

type HeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  children?: React.ReactNode;
  variant?: HeaderStyle;
  className?: string;
};

export default function Header({
  title,
  children,
  variant = "Generic",
  className,
  ...rest
}: HeaderProps) {
  const styleConfig = styles[variant as HeaderStyle];
  return (
    <div {...rest} className={clsx(styleConfig.wrapper, className)}>
      <h1 className={styleConfig.title}>{title}</h1>
      {children}
    </div>
  );
}
