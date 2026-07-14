import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import { useAuth } from "../../Auth";
import type { QuestionUpdate } from "../../QuestionBuilder";
import QuestionBuilderAPI from "../../QuestionBuilder/questionBuilderApi";

export function useUpdateQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const updateQuestion = useCallback(
    async (questionId: string, payload: QuestionUpdate) => {
      setLoading(true);
      setError(null);

      if (!user) {
        const message = "You must be signed in to update questions.";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const updated = await QuestionBuilderAPI.updateQuestion(
          token,
          questionId,
          payload,
        );

        toast.success("Question updated successfully.");
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update question";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  return { updateQuestion, loading, error };
}
