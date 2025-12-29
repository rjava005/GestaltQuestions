import { MdDriveFolderUpload } from "react-icons/md";
import clsx from "clsx";

// Allowed things to upload
export type UploadAccept = "images" | "pdf" | "images_pdf" | "any" | "zip";

export const acceptMap: Record<UploadAccept, string> = {
    images: "image/*",
    pdf: "application/pdf",
    images_pdf: "image/*,application/pdf",
    zip: ".zip,application/zip",
    any: "*",
};

// Some styles
export const uploadFilesBase =
    "w-full mx-auto cursor-pointer transition-colors p-8 flex flex-col items-center justify-center text-center focus-within:outline-none focus-within:ring-2";

export type UploadFilesStyle = "outline" | "solid" | "ghost";
export const UploadFilesStyles: Record<UploadFilesStyle, string> = {
    outline:
        "rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 " +
        "dark:bg-gray-800 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 " +
        "focus-within:ring-blue-500",

    solid:
        "rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",

    ghost: "rounded-lg opacity-50 hover:opacity-75 dark:opacity-60",
};

export type UploadFileSize = "sm" | "md" | "lg" | "full";

export const UploadFilesSize: Record<UploadFileSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "w-full",
};

type UploadFilesProp = {
    onFilesSelected: (files: File[]) => void;
    variant?: UploadFilesStyle;
    size?: UploadFileSize;
    //   Justa  message of what you want them to upload
    message?: string;
    // Wether we accept multiple files at once
    multiple?: boolean;
    accept?: UploadAccept;
};

export default function UploadFiles({
    onFilesSelected,
    variant = "outline",
    size = "md",
    message = "Supports multiple files (HTML, JS, PY)",
    multiple = true,
    accept = "any",
}: UploadFilesProp) {
    const handleClick = () => {
        document.getElementById("file-input")?.click();
    };

    return (
        <div
            className={clsx(
                uploadFilesBase,
                UploadFilesSize[size],
                UploadFilesStyles[variant]
            )}
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            <MdDriveFolderUpload
                className="text-blue-500 dark:text-blue-400 mb-3"
                size={40}
            />
            <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                Click to select file(s)
            </span>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>

            <input
                type="file"
                accept={accept}
                id="file-input"
                className="sr-only"
                multiple={multiple}
                onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    onFilesSelected(files);
                }}
            />
        </div>
    );
}
