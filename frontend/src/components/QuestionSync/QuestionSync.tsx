// Third-party imports
import { FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";

// Local components
import { MyButton } from "../Button/Button";
import { PopUpHelpIcon } from "../Base/PopUpHelper";

// Local utilities / API / types
import { QuestionSyncAPI } from "../../services/api/backend/questionSyncAPI";
import { downloadJson } from "../../utils/downloadUtils";
import type {
  FolderCheckMetrics,
  SyncMetrics,
  UnsyncedQuestion,
} from "../../types/syncTypes";


interface FormatMetricsProps {
  metrics: SyncMetrics;
  deleted: FolderCheckMetrics;
  raw?: UnsyncedQuestion[];
}

const FormatMetrics: React.FC<FormatMetricsProps> = ({
  metrics,
  deleted,
  raw,
}) => {
  const metricLines = Object.entries(metrics);

  return (
    <div>
      <p>✅ Sync Complete</p>
      <p>📊 Metrics:</p>

      {metricLines.map(([key, value]) => (
        <div key={key}>
          • {key}: {value}
        </div>
      ))}

      <p>🗑️ Deleted Questions: {deleted.deleted_from_db}</p>

      <MyButton
        onClick={() => downloadJson(raw, "raw_sync_metrics")}
        className="my-2"
        name="Download raw Sync Results"
      ></MyButton>
    </div>
  );
};

export default function SyncQuestions() {
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
