import React from "react";
import clsx from "clsx";
import { uiPanelVariantStyles, uiPanelSizeStyles, type UIPanelSize, type UIPanelVariant } from "./PanelStyles";


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
            "flex flex-col items-center justify-center text-center rounded-md transition-all duration-200",
            uiPanelVariantStyles[variant as UIPanelVariant],
            uiPanelSizeStyles[size as UIPanelSize],
            className

        )}
    >
        {children}
    </div>
);

export default PLQuestionPanel;
