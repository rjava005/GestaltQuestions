// Third-party imports
import { FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { PopUpHelpIcon } from "../../components/Base/PopUpHelper";
import { FormatMetrics } from "./FormatMetrics";
// Local utilities / API / types
import { QuestionSyncAPI } from "../../services/api/backend/questionSyncAPI";


export default function SyncQuestionsPopUp() {
  const syncQuestions = async () => {
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
  return (
    <div className=" relative flex flex-col items-center ">
      <PopUpHelpIcon
        onClick={syncQuestions}
        value="Syncs local questions and removes deleted ones."
        icon={FaSyncAlt}
      />
    </div>
  );
}
