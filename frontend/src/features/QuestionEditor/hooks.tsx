import { useQuestionCollectionContext } from "./../../context/QuestionCollectionContext";
import { QuestionAPI } from "./../../services/api/backend/questionAPI";
import { useCodeEditorContext } from "./context";
import { useCallback, useState, useEffect } from "react";
import type { FileData } from "../../types/questionTypes";
import { toast } from "react-toastify";
import { downloadJson } from "../../utils/downloadUtils";
import { downloadBlob } from "../../components/QuestionTable/utils/services";

export function useQuestionFiles() {
    const { selectedQuestionID } = useQuestionCollectionContext();
    const { setFileNames, selectedFile, setFileContent, refreshKey } =
        useCodeEditorContext();
    const [filesData, setFileData] = useState<FileData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        if (!selectedQuestionID) {
            setFileData([]);
            setFileNames([]);
            setFileContent("");
            return;
        }
        setLoading(true);

        try {
            const response = await QuestionAPI.getQuestionFiles(selectedQuestionID);
            setFileData(response);
        } catch (error: any) {
            let errorMsg = error.message || "Failed to get question files";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [selectedQuestionID, refreshKey]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    //   Set the selected file
    useEffect(() => {
        const fd = filesData.find((v) => v.filename === selectedFile);
        setFileContent(fd?.content ?? "");
    }, [selectedFile, filesData, refreshKey]);

    useEffect(() => {
        setFileNames(filesData.map((v) => v.filename));
    }, [filesData, setFileNames, refreshKey]);

    return { filesData, loading, error };
}

export function useSaveQuestionFile(onRefresh?: () => void) {
    const [loading, setLoading] = useState(false);

    const saveFile = useCallback(
        async (questionID: string, filename: string, content: string) => {
            setLoading(true);
            try {
                await QuestionAPI.updateFileContent(questionID, filename, content);
                toast.success("File saved successfully!");
                onRefresh?.();
            } catch (error: any) {
                let errorMsg = "Failed to save file" + error.message || "";
                console.error(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        },
        [onRefresh]
    );

    return { saveFile, loading };
}

export function useDeleteQuestionFile(onRefresh?: () => void) {
    const [loading, setLoading] = useState<boolean>(false);
    const deleteFile = useCallback(
        async (questionID: string | null, filename: string | null) => {
            setLoading(true);
            try {
                if (!filename) {
                    console.log("Filename is empty");
                    return;
                }
                if (!questionID) return;
                await QuestionAPI.deleteFile(questionID, filename);
                toast.success("File deleted successfully!");
                onRefresh?.();
            } catch (error: any) {
                let ErrorMsg = "Failed to delete file " + error.message || "";
                console.error(ErrorMsg);
                toast.error(ErrorMsg);
            } finally {
                setLoading(false);
            }
        },
        [onRefresh]
    );

    return { deleteFile, loading };
}

export function useUploadFile(onRefresh?: () => void) {
    const [loading, setLoading] = useState<boolean>(false);
    const uploadFiles = useCallback(
        async (questionID: string, files: File[]) => {
            setLoading(true);
            try {
                await QuestionAPI.uploadFiles(questionID, files);
                toast.success("File uploaded successfully!");
                onRefresh?.();
            } catch (error: any) {
                let errorMsg = "Failed to upload files " + error.message || "";
                console.error(errorMsg);
                toast.error(errorMsg);
            } finally {
            }
            setLoading(false);
        },
        [onRefresh]
    );
    return { uploadFiles, loading };
}

export function useDownloadFile(onRefresh?: () => void) {
    const downloadFile = useCallback(
        async (filename: string, questionID: string) => {
            const response = await QuestionAPI.downloadQuestionFile(questionID, filename)
            downloadBlob(response.blob, response.header)
        },
        [onRefresh]
    );
    return { downloadFile }
}
