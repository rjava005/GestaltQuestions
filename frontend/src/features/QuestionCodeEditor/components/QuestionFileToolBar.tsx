import type { Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";

import { Button } from "../../../components/Button";
import { ShowUploadedFiles, UploadFiles } from "../../../components/UploadFile";
import type { FileData } from "../../../types/fileTypes";
import {
  useCreateFile,
  useDeleteFile,
  useSaveFile,
  useUploadFile,
} from "../../QuestionBuilder";
import { extensionToMime } from "../utils";

type QuestionFileToolBarProps = {
  qid: string;
  files: FileData[];
  activeFile: FileData;
  setFiles: Dispatch<SetStateAction<FileData[]>>;
  setActiveFile: Dispatch<SetStateAction<FileData | null>>;
  onRefresh: () => void;
};

export default function QuestionFileToolBar({
  qid,
  files,
  activeFile,
  setFiles,
  setActiveFile,
  onRefresh,
}: QuestionFileToolBarProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [userFiles, setUserFiles] = useState<File[]>([]);

  const { saveFile, loading: isSaving } = useSaveFile();
  const { createFile, loading: isCreating } = useCreateFile();
  const { deleteFile, loading: isDeleting } = useDeleteFile();
  const { uploadFile, loading: isUploading } = useUploadFile();

  const handleSave = useCallback(async () => {
    await saveFile(qid, activeFile.filename, activeFile.content);
    onRefresh();
  }, [activeFile, onRefresh, qid, saveFile]);

  const handleCreateFile = useCallback(async () => {
    const rawName = window.prompt("New filename (e.g. helper.py):", "");
    const filename = rawName?.trim();
    if (!filename) return;

    if (files.some((file) => file.filename === filename)) {
      window.alert(`File "${filename}" already exists.`);
      return;
    }

    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = extensionToMime[ext] ?? "text/plain";
    const newFile: FileData = { filename, content: "", mime_type: mimeType };

    setFiles((prev) => [...prev, newFile]);
    setActiveFile(newFile);

    await createFile(qid, filename, "");
    onRefresh();
  }, [createFile, files, onRefresh, qid, setActiveFile, setFiles]);

  const handleDeleteFile = useCallback(async () => {
    const confirmed = window.confirm(`Delete "${activeFile.filename}"?`);
    if (!confirmed) return;

    const filenameToDelete = activeFile.filename;

    setFiles((prev) =>
      prev.filter((file) => file.filename !== filenameToDelete),
    );
    setActiveFile(null);

    await deleteFile(qid, filenameToDelete);
    onRefresh();
  }, [activeFile, deleteFile, onRefresh, qid, setActiveFile, setFiles]);

  const handleFileSubmit = useCallback(async () => {
    if (!userFiles.length) return;

    await uploadFile(qid, userFiles);
    onRefresh();
    setShowUpload(false);
    setUserFiles([]);
  }, [onRefresh, qid, uploadFile, userFiles]);

  const handleRemoveQueuedFile = useCallback((index: number) => {
    setUserFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface p-3">
        <div className="flex items-center gap-2">
          <Button
            name={isSaving ? "Saving..." : "Save"}
            onClick={handleSave}
            disabled={isSaving}
            color="editorAction"
          />
          <Button
            name={isCreating ? "Creating..." : "New File"}
            onClick={handleCreateFile}
            disabled={isCreating}
            color="editorAction"
          />
          <Button
            name={isDeleting ? "Deleting..." : "Delete"}
            onClick={handleDeleteFile}
            disabled={isDeleting}
            color="editorDanger"
          />
          <Button
            name="Upload Files"
            onClick={() => setShowUpload((prev) => !prev)}
            disabled={isUploading}
            color="editorAction"
          />
        </div>
      </div>

      {showUpload && (
        <div className="mb-3 grid gap-3 rounded-lg border border-border bg-surface p-3 shadow-soft lg:grid-cols-[minmax(260px,0.6fr)_1fr]">
          <ShowUploadedFiles
            files={userFiles}
            onSubmit={handleFileSubmit}
            onRemove={handleRemoveQueuedFile}
            variant="editorPanel"
          />

          <UploadFiles
            variant="editorDropzone"
            size="full"
            accept="any"
            message="Upload code, images, PDFs up to 10MB each"
            onFilesSelected={(files) =>
              setUserFiles((prev) => [...prev, ...files])
            }
          />
        </div>
      )}
    </>
  );
}
