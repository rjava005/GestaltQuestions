import { QuestionSyncAPI } from "../../services/api/backend/questionSyncAPI";
import { toast } from "react-toastify";
import FormatMetrics from "./FormatMetrics";

export const useSyncedQuestions = () => {
  const syncQuestion = async () => {
    try {
      const syncedMetrics = await QuestionSyncAPI.SyncQuestions();
      // Not sure there is a weird bug where it says deleted but i dont have any deleted
      const prunedQuestions = await QuestionSyncAPI.PruneMissingQuestions();
      toast.info(
        <FormatMetrics
          metrics={syncedMetrics.sync_metrics}
          deleted={prunedQuestions}
          raw={syncedMetrics.sync_raw}
        />,
        {
          position: "top-right",
        }
      );
    } catch (error) {
      toast.error(`Sync Failed\n${String(error)}`, {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  return { syncQuestion };
};
