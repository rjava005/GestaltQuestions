import { useEffect, useState } from "react";
import type { ServerSettings } from "../../QuestionBuilder/components/ServerToggle";
import { QuestionRunnerApi } from "../runtime/questionRuntimeApi";

import { useQuestionInstance } from "./context";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { firebase } from "../../../config/firebaseClient"


export function useLoadQuestionRuntime(
    questionId: string | null,
    serverMode: ServerSettings,
    refreshKey: number = 0,
) {
    const startLoading = useQuestionInstance((s) => s.startLoading);
    const setRuntimeContent = useQuestionInstance((s) => s.setRunTimeContent); // Initially all values are null
    const setError = useQuestionInstance((s) => s.setError);

    useEffect(() => {
        let cancelled = false;
        if (!questionId) {
            setError(null);
            return;
        }
        startLoading();
        const run = async () => {
            try {
                const data = await QuestionRunnerApi.runQuestion(
                    questionId,
                    serverMode,
                );
                if (!cancelled) {
                    setRuntimeContent(data); // stores instance, html, quiz_data, logs, etc.
                }
            } catch (err) {
                if (!cancelled) {
                    const message = err instanceof Error ? err.message : String(err);
                    setError(message);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [
        questionId,
        serverMode,
        refreshKey,
        startLoading,
        setRuntimeContent,
        setError,
    ]);
}

// Backward-compatible alias
export const useRunQuestion = useLoadQuestionRuntime;

export function useQuestionFigureSource(
    src?: string,
    filename?: string,
    useClientFilesDir: boolean = false,
) {
    const qmeta = useQuestionInstance((s) => s.questionMeta);
    const [resolvedImageSrc, setResolvedImageSrc] = useState("");

    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;

        const resolvedSource = filename && qmeta?.storage_path ? filename : (src ?? "");
        const isExternalUrl =
            resolvedSource.startsWith("http://") || resolvedSource.startsWith("https://");

        if (!resolvedSource) {
            setResolvedImageSrc("");
            return;
        }

        if (isExternalUrl) {
            setResolvedImageSrc(resolvedSource);
            return;
        }

        const load = async () => {
            try {
                const relativePath = `${useClientFilesDir ? "clientFiles/" : ""}${filename ?? resolvedSource}`;

                if (qmeta?.storage_path) {
                    const fullObjectPath = `${qmeta.storage_path.replace(/\/+$/, "")}/${relativePath}`;
                    const storage = getStorage(firebase);
                    const downloadUrl = await getDownloadURL(ref(storage, fullObjectPath));



                    const response = await fetch(downloadUrl);

                    console.log(response)
                    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
                    const rawBlob = await response.blob();

                    const imageBlob = rawBlob.type.startsWith("image/")
                        ? rawBlob
                        : rawBlob.slice(0, rawBlob.size, "image/png");
                    const objectUrl = URL.createObjectURL(imageBlob);
                    if (!cancelled) setResolvedImageSrc(objectUrl);
                    return;
                }

                if (!cancelled) setResolvedImageSrc(resolvedSource);
            } catch {
                if (!cancelled) setResolvedImageSrc(resolvedSource);
            }
        };

        void load();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, filename, qmeta?.id, qmeta?.storage_path, useClientFilesDir]);

    return resolvedImageSrc;
}
