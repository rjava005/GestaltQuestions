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
export interface PLSolutionPanelProps {
  title?: string;
  subtitle?: string;
  /** Steps or solution content */
  children?: React.ReactNode;
  /** Additional styling */
  className?: string;
  /** Size of the panel */
  size?: UIPanelSize | string;
  /** Visual variant */
  variant?: UIPanelVariant | string;
  /** Whether to show all steps automatically */
  autoShowAll?: boolean;
}

const PLSolutionPanel: React.FC<PLSolutionPanelProps> = ({
  children,
  className = "",
  title = "Solution",
  subtitle,
  size = "md",
  variant = "default",
  autoShowAll = false,
}) => {
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
        <div className="w-full overflow-auto">
          <h2 className={clsx("text-xl sm:text-2xl", uiTextStyles.title)}>
            {title}
          </h2>
          {subtitle && (
            <p className={clsx("mt-1 text-sm", uiTextStyles.subtitle)}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex-1 w-full px-4 py-2">{visibleSteps}</div>

        <div className="mt-auto mb-4 flex justify-center gap-3">
          {!autoShowAll && stepIndex < steps.length - 1 ? (
            <Button name="Show Next Step" onClick={handleShowNext} />
          ) : (
            <Button name="Reset" color="secondary" onClick={handleReset} />
          )}
        </div>

        <div
          className={clsx(
            "mt-6 border-t border-border pt-4 text-center text-xs",
            uiTextStyles.helper,
          )}
        >
          Review each step before proceeding.
        </div>
      </div>
    </MathJax>
  );
};

export default PLSolutionPanel;
