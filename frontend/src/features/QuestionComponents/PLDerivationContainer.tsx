import clsx from "clsx";
import { MathJax } from "better-react-mathjax";
import { Button } from "../../components/Button";
import React, { useState } from "react";
import { uiPanelSizeStyles, uiPanelVariantStyles, type UIPanelSize, type UIPanelVariant, } from "./PanelStyles";


export interface PLDerivationProps {
    title?: string;
    subtitle?: string;
    reference?: string;           // e.g., “12-14”
    children?: React.ReactNode;   // <pl-derivation-step> tags
    className?: string;
    variant?: UIPanelVariant | string
    size?: UIPanelSize | string
    autoShowAll?: boolean;
}

export function PLDerivation({
    title,
    subtitle,
    reference,
    variant,
    size,
    children,
    className,
    autoShowAll = false
}: PLDerivationProps) {

    const [stepIndex, setStepIndex] = useState<number>(0);
    const steps = React.Children.toArray(children);
    const handleShowNext = () => {
        setStepIndex((prev) => Math.min(prev + 1, steps.length));
    };
    const handleReset = () => {
        setStepIndex(0)
    }

    const visibleSteps = autoShowAll ? steps : steps.slice(0, stepIndex);

    return (
        <MathJax>
            <div
                className={clsx(
                    "h-full flex flex-col items-center text-center rounded-md transition-all duration-200 overflow-auto",
                    uiPanelVariantStyles[variant as UIPanelVariant],
                    uiPanelSizeStyles[size as UIPanelSize],
                    className
                )}
            >
                {/* Header */}
                <div className="text-center pb-4 border-b border-gray-200">
                    {title && (
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    )}
                    {subtitle && (
                        <p className="text-gray-600 italic mt-2">{subtitle}</p>
                    )}
                    {reference && (
                        <p className="text-sm text-gray-500 mt-1">
                            Reference: {reference}
                        </p>
                    )}
                </div>



                {/* Steps container */}
                <div className="flex-1 overflow-y-auto mt-6 space-y-6">
                    {visibleSteps}
                </div>

                <div className="mt-auto mb-4 flex justify-center gap-3">
                    {!autoShowAll && stepIndex < steps.length - 1 ? (
                        <Button
                            name="Show Next Step"
                            onClick={handleShowNext}
                        />
                    ) : (
                        <Button
                            name="Reset"
                            color="secondary"
                            onClick={handleReset}
                        />
                    )}
                </div>
            </div>
        </MathJax>
    );
}