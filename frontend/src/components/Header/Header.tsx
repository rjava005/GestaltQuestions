import clsx from "clsx";
import type React from "react";

type HeaderStyle = "Generic" | "QuestionBuilder";

type HeaderStyleConfig = {
    wrapper: string;
    title: string;
};

const styles: Record<HeaderStyle, HeaderStyleConfig> = {
    Generic: {
        wrapper: "",
        title: "truncate text-2xl font-bold text-slate-900 dark:text-slate-100",
    },
    QuestionBuilder: {
        wrapper: "w-full bg-slate-50 flex flex-col px-6 py-4",
        title:
            "truncate text-3xl font-semibold text-slate-800 tracking-tight mb-4",
    },
};
type HeaderProps = React.HTMLAttributes<HTMLDivElement> & {
    title: string;
    children?: React.ReactNode;
    style?: HeaderStyle;
    className?: string;
};
export default function Header({
    title,
    children,
    style = "Generic",
    className,
    ...rest
}: HeaderProps) {
    const styleConfig = styles[style as HeaderStyle];
    return (
        <div
            {...rest}
            className={clsx(styleConfig.wrapper, className)}
        >
            <h1 className={styleConfig.title}>{title}</h1>
            {children}
        </div>
    );
}
