import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import { getImageBase64FileData } from "../../../../../utils";
import { useQuestionInstance } from "../../../instance";
export type ImageSize = "sm" | "md" | "lg";

export interface PLFigureProps {
  src?: string;
  filename?: string;
  className?: string;
  size?: ImageSize | string;
  variant?: "default" | "minimal" | string;
  useClientFilesDir?: boolean;
}

const variantStyles: Record<string, string> = {
  default:
    "border border-[var(--color-border)] shadow-sm rounded-[var(--radius-md)] bg-[var(--color-surface-strong)]",
  minimal:
    "border border-transparent bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] rounded-[var(--radius-md)]",
};

const sizeStyles: Record<ImageSize, string> = {
  sm: "max-w-[150px] md:max-w-[200px]",
  md: "max-w-[300px] md:max-w-[400px]",
  lg: "max-w-[500px] md:max-w-[700px]",
};
export default function PLFigure({
  src,
  filename,
  className = "",
  size = "md",
  variant = "default",
}: PLFigureProps) {
  const files = useQuestionInstance((state) => state.files);

  const resolvedName = src || filename || "default.png";

  const fileMatch = files?.find((f) => {
    if (!src && !filename) return false;
    return f.filename === src || f.filename === filename;
  });

  const resolvedImage = fileMatch
    ? getImageBase64FileData(fileMatch)
    : resolvedName;

  return (
    <div
      className={twMerge(
        clsx(
          "flex justify-center items-center overflow-hidden my-4",
          variantStyles[variant],
          className,
        ),
      )}
    >
      <img
        src={resolvedImage ?? resolvedName}
        alt={resolvedName}
        className={clsx(
          "w-full h-auto object-contain transition-transform duration-(--duration-base) hover:scale-[1.02]",
          sizeStyles[size as ImageSize],
        )}
      />
    </div>
  );
}
