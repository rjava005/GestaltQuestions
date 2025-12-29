import clsx from "clsx";

type SectionVarient = "hero" | "primary";

const SectionTheme: Record<SectionVarient, string> = {
    hero: "min-h-screen flex items-center justify-center bg-blue-100 dark:bg-background transition-colors duration-300",
    primary: "min-h-screen border px-5 py-20 rounded-md",
};
type SectionProps = React.HtmlHTMLAttributes<HTMLElement> & {
    children: React.ReactNode;
    className?: string;
    variant?: SectionVarient;
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
            className={clsx(variant ? SectionTheme[variant as SectionVarient] : "", className)}
            {...rest}
        >
            {" "}
            {children}
        </section>
    );
}
