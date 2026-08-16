/* eslint-disable no-unused-vars */

import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";

import { questionAPIURL } from "../../../../../config/apiConfig";
import { firebase } from "../../../../../config/firebaseClient";
import { useQuestionInstance } from "../../../instance";

export function useQuestionJsonAsset<T>(
  fileName: string,
  validate: (value: unknown) => T,
) {
  const qmeta = useQuestionInstance((state) => state.qmeta);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; value: T }
    | { status: "error"; message: string }
  >({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    void (async () => {
      try {
        if (!fileName) throw new Error("No visual asset file was specified.");
        let url = fileName;
        if (qmeta?.storage_type === "local" && qmeta.id) {
          const path = fileName.split("/").map(encodeURIComponent).join("/");
          url = `${questionAPIURL}/questions/${encodeURIComponent(qmeta.id)}/runtimes/assets/${path}`;
        } else if (qmeta?.storage_path) {
          url = await getDownloadURL(
            ref(
              getStorage(firebase),
              `${qmeta.storage_path.replace(/\/+$/, "")}/${fileName}`,
            ),
          );
        }
        const response = await globalThis.fetch(url);
        if (!response.ok)
          throw new Error(`Could not load ${fileName} (${response.status}).`);
        const value = validate(await response.json());
        if (!cancelled) setState({ status: "ready", value });
      } catch (error) {
        if (!cancelled)
          setState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileName, qmeta?.id, qmeta?.storage_path, qmeta?.storage_type, validate]);
  return state;
}
