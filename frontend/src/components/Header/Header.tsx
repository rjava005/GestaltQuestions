import clsx from "clsx";
import type React from "react";

type HeaderStyle = "Generic" | "QuestionBuilder";
const styles: Record<HeaderStyle, string> = {
  Generic: "",
  QuestionBuilder: "min-h-screen bg-slate-50 flex flex-col",
};
type HeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  style?: HeaderStyle;
  className?: string;
};
export default function Header({
  children,
  style = "Generic",
  className,
  ...rest
}: HeaderProps) {
  return (
    <div {...rest} className={clsx(styles[style as HeaderStyle], className)}>
      {children}
    </div>
  );
}
