import type { HITLRequest, HITLResponse } from "langchain";
import { useEffect } from "react";
import { useCallback, useMemo, useState } from "react";

import { ChatApi } from "../../services/Chat";
import { useAuth } from "../Auth";
import { useThreadStore } from "./instance/store";

export function useLoadUserThreads() {
  const { user } = useAuth();
  const setThreads = useThreadStore((s) => s.setThreads);
  const threadId = useThreadStore((s) => s.threadId);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) return;

      try {
        const authToken = await user.getIdToken();
        const threads = await ChatApi.getUserThreads(authToken);

        if (!cancelled) {
          setThreads(threads);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("Error", error);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user, setThreads, threadId]); // Refresh when setthreads, or thread id is updated
}

type SubmitHITLResume = (resume: HITLResponse) => Promise<unknown> | unknown;
export function useHITLReview({
  interruptValue,
  submitResume,
}: {
  interruptValue: unknown;
  submitResume: SubmitHITLResume;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const hitlRequest = interruptValue as HITLRequest | undefined;

  const actionRequests = useMemo(
    () => hitlRequest?.actionRequests ?? [],
    [hitlRequest],
  );

  const reviewConfigs = useMemo(
    () => hitlRequest?.reviewConfigs ?? [],
    [hitlRequest],
  );

  const handleApprove = useCallback(
    async (index: number) => {
      if (!hitlRequest) return;
      setIsProcessing(true);
      try {
        // Appends all the action request and approves the selected one
        await submitResume({
          decisions: actionRequests.map((_, i) =>
            i === index
              ? {
                  type: "approve",
                }
              : {
                  type: "reject",
                  message: "Rejected along with other actions",
                },
          ),
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [actionRequests, hitlRequest, submitResume],
  );

  const handleReject = useCallback(
    async (index: number, reason: string) => {
      if (!hitlRequest) return;
      setIsProcessing(true);
      try {
        await submitResume({
          decisions: actionRequests.map((_, i) =>
            i === index
              ? {
                  type: "reject",
                  message: reason || "User rejected",
                }
              : {
                  type: "reject",
                  message: "Rejected along with other actions",
                },
          ),
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [hitlRequest, actionRequests, submitResume],
  );
  const handleEdit = useCallback(
    async (index: number, editedArgs: Record<string, unknown>) => {
      if (!hitlRequest) return;

      const originalAction = actionRequests[index];
      if (!originalAction) return;

      setIsProcessing(true);

      try {
        await submitResume({
          decisions: actionRequests.map((_, i) =>
            i === index
              ? {
                  type: "edit",
                  editedAction: {
                    name: originalAction.name,
                    args: editedArgs,
                  },
                }
              : {
                  type: "approve",
                },
          ),
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [actionRequests, hitlRequest, submitResume],
  );
  return {
    hitlRequest,
    actionRequests,
    reviewConfigs,
    isProcessing,
    handleApprove,
    handleReject,
    handleEdit,
  };
}
