import { useCallback, useEffect, useMemo, useState } from "react";

import type { FileData } from "../../../types/fileTypes";
import { getImageBase64FileData, isImageExt } from "../../../utils";

export function useActiveQuestionFile(files: FileData[]) {
  const [activeFile, setActiveFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (!files.length) {
      setActiveFile(null);
      setLoading(false);
      return;
    }

    setActiveFile((current) => {
      if (current && files.some((file) => file.filename === current.filename)) {
        return (
          files.find((file) => file.filename === current.filename) ?? current
        );
      }

      return files[0];
    });

    setLoading(false);
  }, [files]);

  return {
    activeFile,
    setActiveFile,
    loading,
  };
}

export function useEditableQuestionFiles(sourceFiles: FileData[]) {
  const [files, setFiles] = useState<FileData[]>([]);

  useEffect(() => {
    setFiles(sourceFiles);
  }, [sourceFiles]);

  const updateFileContent = useCallback((filename: string, content: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.filename === filename ? { ...file, content } : file,
      ),
    );
  }, []);

  return {
    files,
    setFiles,
    updateFileContent,
  };
}

type ActiveFilePreview =
  | { type: "none" }
  | { type: "image"; url: string }
  | { type: "pdf"; url: string };

export function useActiveFilePreview(
  activeFile: FileData | null | undefined,
): ActiveFilePreview {
  return useMemo(() => {
    if (!activeFile) {
      return { type: "none" };
    }

    if (isImageExt(activeFile.filename)) {
      const url = getImageBase64FileData(activeFile);
      if (!url) {
        return { type: "none" };
      }

      return {
        type: "image",
        url,
      };
    }

    const isPdf =
      activeFile.filename.toLowerCase().endsWith(".pdf") ||
      activeFile.mime_type?.includes("pdf");

    if (isPdf) {
      return {
        type: "pdf",
        url: `data:${activeFile.mime_type || "application/pdf"};base64,${activeFile.content}`,
      };
    }

    return { type: "none" };
  }, [activeFile]);
}
