import clsx from "clsx";


export interface PLDerivationStepProps {
    children?: React.ReactNode;   // markdown / LaTeX
    className?: string;
}


export function PLDerivationStep({
    children,
    className,
}: PLDerivationStepProps) {
    return (
        <div
            className={clsx(
                "p-4 bg-gray-50 border-l-4 border-blue-500 rounded-md shadow-sm leading-relaxed text-[15px]",
                className
            )}
        >
            {children}
        </div>
    );
}