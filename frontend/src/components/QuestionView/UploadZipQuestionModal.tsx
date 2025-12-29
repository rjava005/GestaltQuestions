import UploadFiles from "../UploadFile/UploadFileComponent";
import { useQuestionToolBarActions } from "../../hooks/useQuestionsToolBarActions";
import { useState } from "react";
import { Button } from "../Button/Button";

export default function UploadZipQuestionModal({
    setShowModal,
}: {
    setShowModal: (visible: boolean) => void;
}) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const { handleQuestionUpload } = useQuestionToolBarActions();

    const onFileSelect = (files: File[]) => {
        setSelectedFiles(files);
    };

    return (
        <div className="space-y-4 flex flex-col items-center text-sm text-gray-700 dark:text-gray-300">
            <h1 className="font-semibold text-xl">Upload a Question ZIP Package</h1>

            <p>
                Upload a <strong>.zip folder</strong> containing your question files. To
                ensure compatibility, your ZIP{" "}
                <strong>
                    must include an <code>info.json</code>
                </strong>{" "}
                file containing the question metadata used for syncing.
            </p>

            <p>At minimum, your ZIP should contain:</p>

            <ul className="list-disc ml-5 space-y-1">
                <li>
                    <code>question.html</code> – the question content
                </li>
                <li>
                    <code>info.json</code> – metadata for syncing
                </li>
            </ul>

            <p>For numerical or computational questions, you may also include:</p>

            <ul className="list-disc ml-5 space-y-1">
                <li>
                    <code>server.js</code> – JavaScript computation logic (optional)
                </li>
                <li>
                    <code>server.py</code> – Python computation logic (optional)
                </li>
            </ul>

            <p>
                If you need a reference format or want to download a starter template,
                you can access it{" "}
                <a href="#" className="text-blue-600 hover:underline">
                    here
                </a>
                .
            </p>

            <div className="pt-2">
                <UploadFiles
                    onFilesSelected={onFileSelect}
                    message="Upload a ZIP Folder"
                    accept="zip"
                    multiple={false}
                />
            </div>
            <div className="space-y-3 flex items-center flex-col">
                {selectedFiles.map((file, idx) => (
                    <div key={idx} className="text-lg text-indigo-600 font-medium">
                        Selected Question:{" "}
                        <span className="font-semibold text-black">{file.name}</span>
                    </div>
                ))}

                {selectedFiles.length > 0 && (
                    <div className="pt-2">
                        <Button
                            name="Upload Question"
                            onClick={() => {
                                handleQuestionUpload(selectedFiles);
                                setShowModal(false);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
