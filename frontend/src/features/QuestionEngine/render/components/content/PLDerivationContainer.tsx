import { MathJax } from "better-react-mathjax";
import clsx from "clsx";
import React, { useState } from "react";

import { Button } from "../../../../../components/Button";
import {
  uiPanelBaseStyles,
  type UIPanelSize,
  uiPanelSizeStyles,
  type UIPanelVariant,
  uiPanelVariantStyles,
  uiTextStyles,
} from "../../../styles";

export interface PLDerivationProps {
  title?: string;
  subtitle?: string;
  reference?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: UIPanelVariant | string;
  size?: UIPanelSize | string;
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
  autoShowAll = false,
}: PLDerivationProps) {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const steps = React.Children.toArray(children);
  const handleShowNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, steps.length));
  };
  const handleReset = () => {
    setStepIndex(0);
  };

  const visibleSteps = autoShowAll ? steps : steps.slice(0, stepIndex);

  return (
    <MathJax>
      <div
        className={clsx(
          "h-full flex flex-col items-center text-center overflow-auto",
          uiPanelBaseStyles,
          uiPanelVariantStyles[variant as UIPanelVariant],
          uiPanelSizeStyles[size as UIPanelSize],
          className,
        )}
      >
        <div className="text-center pb-4 border-b border-border w-full">
          {title && (
            <h1 className={clsx("text-2xl", uiTextStyles.title)}>{title}</h1>
          )}
          {subtitle && (
            <p className={clsx("italic mt-2", uiTextStyles.subtitle)}>
              {subtitle}
            </p>
          )}
          {reference && (
            <p className={clsx("text-sm mt-1", uiTextStyles.helper)}>
              Reference: {reference}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-6 space-y-6 w-full">
          {visibleSteps}
        </div>

        <div className="mt-auto mb-4 flex justify-center gap-3">
          {!autoShowAll && stepIndex < steps.length - 1 ? (
            <Button name="Show Next Step" onClick={handleShowNext} />
          ) : (
            <Button name="Reset" color="secondary" onClick={handleReset} />
          )}
        </div>
      </div>
    </MathJax>
  );
}
