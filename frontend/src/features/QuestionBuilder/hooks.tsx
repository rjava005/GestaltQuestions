import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { type FileData } from "../../types/fileTypes";
import type {
  QuestionAllRow,
  QuestionCreate,
  QuestionFilter,
  QuestionRead,
} from "../../types/questionTypes";
import { useAuth } from "../Auth";
import QuestionBuilderAPI from "./questionBuilderApi";

export function useMyQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setQuestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const data = await QuestionBuilderAPI.listMyQuestions(token);
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load questions",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { questions, loading, error };
}

export function useFilterMyQuestions(filter: Partial<QuestionFilter>) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const data = await QuestionBuilderAPI.filterQuestions(token, filter);
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load questions",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [user, filter]);

  return { questions, loading, error };
}

export function useFilterGeneralQuestions(filter: QuestionFilter) {
  const [questions, setQuestions] = useState<QuestionAllRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await QuestionBuilderAPI.filterAllQuestions(filter);
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load all questions",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  return { questions, loading, error };
}

export function useQuestionFileData(qid: string, refreshKey = 0) {
  const { user } = useAuth();
  const [fileData, setFileData] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setFileData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const data = await QuestionBuilderAPI.getQuestionFileData(token, qid);
        if (!cancelled) setFileData(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load question files",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [user, qid, refreshKey]);

  return { fileData, loading, error };
}

export function useSaveFile(onRefresh?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const saveFile = useCallback(
    async (questionId: string, filename: string, content: unknown) => {
      setLoading(true);
      setError(null);

      if (!user) {
        setError("You must be signed in to save files.");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        await QuestionBuilderAPI.writeFile(
          token,
          questionId,
          filename,
          content,
        );
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save file");
      } finally {
        setLoading(false);
      }
    },
    [user, onRefresh],
  );

  return { saveFile, loading, error };
}

export function useCreateFile(onRefresh?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createFile = useCallback(
    async (questionId: string, filename: string, initialContent = "") => {
      setLoading(true);
      setError(null);

      if (!user) {
        setError("You must be signed in to create files.");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        await QuestionBuilderAPI.writeFile(
          token,
          questionId,
          filename,
          initialContent,
        );
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create file");
      } finally {
        setLoading(false);
      }
    },
    [user, onRefresh],
  );

  return { createFile, loading, error };
}

export function useDeleteFile(onRefresh?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const deleteFile = useCallback(
    async (questionId: string, filename: string) => {
      setLoading(true);
      setError(null);

      if (!user) {
        setError("You must be signed in to upload files.");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        await QuestionBuilderAPI.deleteFile(token, questionId, filename);
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete file");
      } finally {
        setLoading(false);
      }
    },
    [user, onRefresh],
  );

  return { deleteFile, loading, error };
}

export function useUploadFile(onRefresh?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const uploadFile = useCallback(
    async (questionId: string, files: File[]) => {
      setLoading(true);
      setError(null);

      if (!user) {
        setError("You must be signed in to delete files.");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        await QuestionBuilderAPI.uploadFiles(token, questionId, files);
        console.log("Uploaded files");
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file");
      } finally {
        setLoading(false);
      }
    },
    [user, onRefresh],
  );
  return { uploadFile, loading, error };
}

export function useQuestionMetadata(qid: string | null | undefined) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [questionMetadata, setQuestionMetadata] = useState<QuestionRead | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      if (!user || !qid) {
        if (!cancelled) {
          setQuestionMetadata(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const data = await QuestionBuilderAPI.getQuestion(token, qid);

        if (!cancelled) setQuestionMetadata(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load question metadata",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, [qid, user]);

  return { questionMetadata, loading, error };
}

export function useCreateQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createQuestion = useCallback(
    async (payload: QuestionCreate, files?: File[]) => {
      setLoading(true);
      setError(null);

      if (!user) {
        setError("You must be signed in to delete files.");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const qCreated = await QuestionBuilderAPI.createQuestion(
          token,
          payload,
        );
        const qId = qCreated.id;
        if (files) {
          await QuestionBuilderAPI.uploadFiles(token, qId, files);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file");
      } finally {
        setLoading(false);
      }
    },
    [user],
  );
  return { createQuestion, loading, error };
}

export function useDeleteQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const deleteQuestion = useCallback(
    async (qids: string[]) => {
      setLoading(true);
      setError(null);

      if (!user) {
        const message = "You must be signed in to delete questions.";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const results = await Promise.allSettled(
          qids.map((qid) => QuestionBuilderAPI.deleteQuestion(token, qid)),
        );
        const failedQids = results
          .map((result, index) =>
            result.status === "rejected" ? qids[index] : null,
          )
          .filter((qid): qid is string => qid !== null);
        const successCount = results.length - failedQids.length;

        if (failedQids.length === 0) {
          toast.success(
            successCount === 1
              ? "Question deleted successfully."
              : `${successCount} questions deleted successfully.`,
          );
        } else if (successCount === 0) {
          const message =
            failedQids.length === 1
              ? `Failed to delete question ${failedQids[0]}.`
              : `Failed to delete ${failedQids.length} questions.`;
          setError(message);
          toast.error(message);
        } else {
          const failedList = failedQids.slice(0, 3).join(", ");
          const remaining =
            failedQids.length > 3 ? ` +${failedQids.length - 3} more` : "";
          const message = `Deleted ${successCount}/${results.length}. Failed: ${failedList}${remaining}.`;
          setError(message);
          toast.warn(message);
        }

        return results;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to process delete requests.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );
  return { deleteQuestion, loading, error };
}

export function useDownloadQuestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const downLoadQuestions = useCallback(
    async (qids: string[]) => {
      setLoading(true);
      setError(null);

      if (!user) {
        const message = "You must be signed in to download questions.";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const results = await Promise.allSettled(
          qids.map((qid) => QuestionBuilderAPI.downloadQuestion(token, qid)),
        );
        const failedQids = results
          .map((result, index) =>
            result.status === "rejected" ? qids[index] : null,
          )
          .filter((qid): qid is string => qid !== null);
        const successCount = results.length - failedQids.length;

        if (failedQids.length === 0) {
          toast.success(
            successCount === 1
              ? "Question download started."
              : `${successCount} question downloads started.`,
          );
        } else if (successCount === 0) {
          const message =
            failedQids.length === 1
              ? `Failed to download question ${failedQids[0]}.`
              : `Failed to download ${failedQids.length} questions.`;
          setError(message);
          toast.error(message);
        } else {
          const failedList = failedQids.slice(0, 3).join(", ");
          const remaining =
            failedQids.length > 3 ? ` +${failedQids.length - 3} more` : "";
          const message = `Started ${successCount}/${results.length} downloads. Failed: ${failedList}${remaining}.`;
          setError(message);
          toast.warn(message);
        }

        return results;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to process download requests.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );
  return { downLoadQuestions, loading, error };
}

export function useCopyQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const copyQuestion = useCallback(
    async (qids: string[]) => {
      setLoading(true);
      setError(null);

      if (!user) {
        const message = "You must be signed in to copy questions.";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();

        const results = await Promise.allSettled(
          qids.map((qid) => QuestionBuilderAPI.copyQuestion(token, qid)),
        );
        const failedQids = results
          .map((result, index) =>
            result.status === "rejected" ? qids[index] : null,
          )
          .filter((qid): qid is string => qid !== null);
        const successCount = results.length - failedQids.length;

        if (failedQids.length === 0) {
          toast.success(
            successCount === 1
              ? "Question copied."
              : `${successCount} questions copied.`,
          );
        } else if (successCount === 0) {
          const message =
            failedQids.length === 1
              ? `Failed to copy question ${failedQids[0]}.`
              : `Failed to copy ${failedQids.length} questions.`;
          setError(message);
          toast.error(message);
        } else {
          const failedList = failedQids.slice(0, 3).join(", ");
          const remaining =
            failedQids.length > 3 ? ` +${failedQids.length - 3} more` : "";
          const message = `Copied ${successCount}/${results.length} questions. Failed: ${failedList}${remaining}.`;
          setError(message);
          toast.warn(message);
        }

        return results;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to process copy requests.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );
  return { copyQuestion, loading, error };
}
