import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";

import { firebase } from "../../../config/firebaseClient";
import { questionAPIURL } from "../../../config/apiConfig";
import type {
  PreviousCircuitVariant,
  QuestionRunResponse,
  QuestionRuntimeLanguage,
} from "../../../services/QuestionRuntime";
import { QuestionRuntimeApi } from "../../../services/QuestionRuntime";
import { useQuestionInstance } from "../instance";

export function useRunQuestion(
  questionID: string,
  serverMode: QuestionRuntimeLanguage | null,
  refreshKey?: number,
  previousCircuitVariant?: PreviousCircuitVariant,
) {
  const setRunTimeContent = useQuestionInstance((s) => s.setRunTimeContent);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [qPayload, setQPayload] = useState<QuestionRunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await QuestionRuntimeApi.runQuestion(
          questionID,
          serverMode,
          previousCircuitVariant,
        );

        if (!cancelled) {
          setQPayload(data);
          setRunTimeContent(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    questionID,
    serverMode,
    refreshKey,
    previousCircuitVariant,
    setRunTimeContent,
  ]);

  return {
    qPayload,
    error,
    loading,
  };
}

export function useQuestionFigureSource(
  src?: string,
  filename?: string,
  useClientFilesDir: boolean = false,
) {
  const qmeta = useQuestionInstance((s) => s.qmeta);
  const [resolvedImageSrc, setResolvedImageSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const resolvedSource =
      filename && qmeta?.storage_path ? filename : (src ?? "");
    const isExternalUrl =
      resolvedSource.startsWith("http://") ||
      resolvedSource.startsWith("https://");

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

        if (qmeta?.storage_type === "local" && qmeta.id) {
          const encodedPath = relativePath
            .split("/")
            .map(encodeURIComponent)
            .join("/");
          const assetUrl = `${questionAPIURL}/questions/${encodeURIComponent(qmeta.id)}/runtimes/assets/${encodedPath}`;
          if (!cancelled) setResolvedImageSrc(assetUrl);
          return;
        }

        if (qmeta?.storage_path) {
          const fullObjectPath = `${qmeta.storage_path.replace(/\/+$/, "")}/${relativePath}`;
          const storage = getStorage(firebase);
          const downloadUrl = await getDownloadURL(
            ref(storage, fullObjectPath),
          );

          const response = await fetch(downloadUrl);

          console.log(response);
          if (!response.ok)
            throw new Error(`Failed to fetch image: ${response.status}`);
          const rawBlob = await response.blob();

          const imageBlob = rawBlob.type.startsWith("image/")
            ? rawBlob
            : rawBlob.slice(0, rawBlob.size, "image/png");
          objectUrl = URL.createObjectURL(imageBlob);
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
  }, [
    src,
    filename,
    qmeta?.id,
    qmeta?.storage_path,
    qmeta?.storage_type,
    useClientFilesDir,
  ]);

  return resolvedImageSrc;
}
