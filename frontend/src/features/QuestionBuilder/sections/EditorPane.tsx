import { Container } from "../../../components/Container";
import { type FileData } from "../../../types/fileTypes";
import { CodeEditor } from "../../../components/CodeEditor";
import { DropDown } from "../../../components/DropDown";
import {
    useCreateFile,
    useDeleteFile,
    useSaveFile,
    useUploadFile,
} from "../hooks";
import { Button } from "../../../components/Button";
import { useCallback, useMemo, useEffect, useState } from "react";
import { UploadFiles, ShowUploadedFiles } from "../../../components/UploadFile";
import {
    getImageBase64FileData,
    isImageExt,
} from "../../../utils/parsingUtils";

type EditorPaneProps = {
    qid: string;
    fileData: FileData[];
};

const extensionToMime: Record<string, string> = {
    html: "text/html",
    js: "application/javascript",
    ts: "application/typescript",
    py: "text/x-python",
    json: "application/json",
    md: "text/markdown",
};

const toEditorLanguage = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "html";
    const languageMap: Record<string, string> = {
        py: "python",
        python: "python",
        js: "javascript",
        javascript: "javascript",
        ts: "typescript",
        json: "json",
        html: "html",
        md: "markdown",
    };
    return languageMap[ext] ?? "plaintext";
};



export default function EditorPane({ qid, fileData }: EditorPaneProps) {
    const [files, setFiles] = useState<FileData[]>(fileData ?? []);
    const [selectedFile, setSelectedFile] = useState<string>("");
    const [showUpload, setShowUpload] = useState<boolean>(false);
    const [userFiles, setUserFiles] = useState<File[]>([]);
    const [image, setImage] = useState<string | null>(null);

    const { saveFile, loading: isSaving } = useSaveFile();
    const { createFile, loading: isCreating } = useCreateFile();
    const { deleteFile, loading: isDeleting } = useDeleteFile();
    const { uploadFile, loading: isUploading } = useUploadFile();

    const handleFileSubmit = useCallback(() => {
        if (!userFiles.length) return;
        uploadFile(qid, userFiles);
        setShowUpload(false);
        setUserFiles([]);
    }, [qid, uploadFile, userFiles]);

    useEffect(() => {
        setFiles(fileData ?? []);
    }, [fileData]);

    useEffect(() => {
        if (!files.length) {
            setSelectedFile("");
            return;
        }
        if (!selectedFile || !files.some((f) => f.filename === selectedFile)) {
            setSelectedFile(files[0].filename);
        }
    }, [files, selectedFile]);

    const activeFile = useMemo(
        () => files.find((f) => f.filename === selectedFile) ?? files[0],
        [files, selectedFile],
    );

    useEffect(() => {
        if (!selectedFile || !activeFile) {
            setImage(null);
            return;
        }

        console.log("Inspecting image", selectedFile)

        if (isImageExt(selectedFile)) {
            const imageUrl = getImageBase64FileData(activeFile);
            setImage(imageUrl);
            return;
        }

        setImage(null);
    }, [selectedFile, activeFile]);

    const language = useMemo(
        () => (activeFile ? toEditorLanguage(activeFile.filename) : "html"),
        [activeFile],
    );

    const isPdfFile = useMemo(
        () =>
            Boolean(
                activeFile?.filename.toLowerCase().endsWith(".pdf") ||
                activeFile?.mime_type?.includes("pdf"),
            ),
        [activeFile],
    );

    const updateFileContent = useCallback((filename: string, content: string) => {
        setFiles((prev) =>
            prev.map((f) => (f.filename === filename ? { ...f, content } : f)),
        );
    }, []);
    const handleRemoveQueuedFile = useCallback((index: number) => {
        setUserFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSave = useCallback(async () => {
        if (!activeFile) return;
        await saveFile(qid, activeFile.filename, activeFile.content);
    }, [activeFile, qid, saveFile]);

    const handleCreateFile = useCallback(async () => {
        const rawName = window.prompt("New filename (e.g. helper.py):", "");
        const filename = rawName?.trim();
        if (!filename) return;

        if (files.some((f) => f.filename === filename)) {
            window.alert(`File "${filename}" already exists.`);
            return;
        }

        const ext = filename.split(".").pop()?.toLowerCase() ?? "";
        const mimeType = extensionToMime[ext] ?? "text/plain";
        const newFile: FileData = { filename, content: "", mime_type: mimeType };

        setFiles((prev) => [...prev, newFile]);
        setSelectedFile(filename);

        await createFile(qid, filename, "");
    }, [files, qid, createFile]);

    const handleDeleteFile = useCallback(async () => {
        if (!activeFile) return;
        const confirmed = window.confirm(`Delete "${activeFile.filename}"?`);
        if (!confirmed) return;

        const filenameToDelete = activeFile.filename;
        setFiles((prev) => prev.filter((f) => f.filename !== filenameToDelete));

        await deleteFile(qid, filenameToDelete);
    }, [activeFile, qid, deleteFile]);

    if (!files.length || !activeFile) {
        return (
            <Container header="Code Editor">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-text-muted">No files available.</p>
                    <Button
                        name={isCreating ? "Creating..." : "New File"}
                        onClick={handleCreateFile}
                        disabled={isCreating}
                    />
                </div>
            </Container>
        );
    }

    return (
        <Container header="Code Editor">
            <div className="mb-3 flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface p-3">
                <div className="min-w-55 flex-1">
                    <DropDown
                        label="Question Files"
                        options={files.map((f) => f.filename)}
                        selected={activeFile.filename}
                        setSelected={setSelectedFile}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        name={isSaving ? "Saving..." : "Save"}
                        onClick={handleSave}
                        disabled={isSaving}
                    />
                    <Button
                        name={isCreating ? "Creating..." : "New File"}
                        onClick={handleCreateFile}
                        disabled={isCreating}
                        color="secondary"
                    />
                    <Button
                        name={isDeleting ? "Deleting..." : "Delete"}
                        onClick={handleDeleteFile}
                        disabled={isDeleting}
                        color="danger"
                    />
                    <Button
                        name={"Upload Files"}
                        onClick={() => setShowUpload((prev) => !prev)}
                        disabled={isUploading}
                        color="neutral"
                    />
                </div>
            </div>
            {showUpload && (
                <>
                    <UploadFiles
                        variant="editor"
                        accept="any"
                        message="Upload files for this question (code, images, PDFs)"
                        onFilesSelected={(f) => setUserFiles(f)}
                    ></UploadFiles>

                    <ShowUploadedFiles
                        files={userFiles}
                        onSubmit={() => handleFileSubmit()}
                        onRemove={handleRemoveQueuedFile}

                    ></ShowUploadedFiles>
                </>
            )}

            {image ? (
                <img
                    src={image}
                    alt={selectedFile ?? "decoded image"}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md border border-border"
                />
            ) : isPdfFile ? (
                <iframe
                    title={activeFile.filename}
                    src={`data:${activeFile.mime_type || "application/pdf"};base64,${activeFile.content}`}
                    className="w-full h-[70vh] rounded-lg border border-border bg-surface"
                />
            ) : (
                <CodeEditor
                    value={activeFile.content}
                    setValue={(val) => updateFileContent(activeFile.filename, val)}
                    language={language}
                />
            )}
        </Container>
    );
}
