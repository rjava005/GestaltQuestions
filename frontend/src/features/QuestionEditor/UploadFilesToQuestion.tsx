import { useState } from "react";

import { Button } from "../../components/Button";
import { UploadFiles } from "../../components/UploadFile";
import { useUploadFile } from "./hooks";
import { useCodeEditorContext } from "./context";
import type { FileOptions } from "./types";

export function UploadFilesToQuestion({ questionID }: FileOptions) {
    const [files, setFiles] = useState<File[]>([]);
    const { setRefreshKey } = useCodeEditorContext();
    const { uploadFiles } = useUploadFile(() => setRefreshKey(prev => prev + 1));
    const onFileSelect = (files: File[]) => {
        setFiles(files);
    };

    if (!questionID) return;
    return (
        <div className="flex flex-col items-center w-full mx-auto p-4">
            <h1 className="mb-4 text-lg sm:text-xl font-semibold tracking-wide text-black">
                Upload Files to Question
            </h1>

            {/* File Picker */}
            <div className="w-full mb-4">
                <UploadFiles onFilesSelected={onFileSelect} />
            </div>

            {/* Selected Files */}
            <div className="flex flex-col gap-1 w-full text-sm text-gray-800 mb-4">
                {files.map((file, index) => (
                    <div
                        key={index}
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 transition-colors hover:bg-gray-100"
                    >
                        {file.name}
                    </div>
                ))}
            </div>

            {/* Action */}
            <Button name="Upload" onClick={() => uploadFiles(questionID, files)} />
        </div>
    );
}
