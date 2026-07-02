import clsx from "clsx";
import React from "react";

import {
  uiPanelBaseStyles,
  type UIPanelSize,
  uiPanelSizeStyles,
  type UIPanelVariant,
  uiPanelVariantStyles,
} from "../../../styles";

export interface PLQuestionPanelProps {
  children?: React.ReactNode;
  className?: string;
  size?: UIPanelSize | string;
  /** Visual variant */
  variant?: UIPanelVariant | string;
}

const PLQuestionPanel: React.FC<PLQuestionPanelProps> = ({
  children,
  className = "",
  size = "md",
  variant = "default",
}) => (
  <div
    className={clsx(
      "flex flex-col items-center justify-center text-center",
      uiPanelBaseStyles,
      uiPanelVariantStyles[variant as UIPanelVariant],
      uiPanelSizeStyles[size as UIPanelSize],
      className,
    )}
  >
    {children}
  </div>
);

export default PLQuestionPanel;
