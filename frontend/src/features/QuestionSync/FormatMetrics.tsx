import type {
  SyncMetrics,
  FolderCheckMetrics,
  UnsyncedQuestion,
} from "../../types/syncTypes";
import { downloadJson } from "../../utils/downloadUtils";
import { Button } from "../../components/Button";
export type FormatMetricsProps = {
  metrics: SyncMetrics;
  deleted: FolderCheckMetrics;
  raw?: UnsyncedQuestion[];
};

export const FormatMetrics: React.FC<FormatMetricsProps> = ({
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

      <Button
        onClick={() => downloadJson(raw, "raw_sync_metrics")}
        className="my-2"
        name="Download raw Sync Results"
      ></Button>
    </div>
  );
};
