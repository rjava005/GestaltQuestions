import { useState } from "react";

import {
  approvalActionButtonStyles,
  approvalActionGroupClassName,
} from "./ApprovalActions";
export function RejectReasonInput({
  isProcessing,
  onReject,
  setIsRejected,
}: {
  isProcessing: boolean;
  onReject: (reason: string) => void;
  setIsRejected: () => void;
}) {
  const [rejectReason, setRejectReason] = useState<string>("");
  return (
    <div className="border-t border-border bg-surface-secondary px-4 py-3 space-y-3">
      <label
        htmlFor="hitl-reject-reason"
        className="block text-xs font-medium text-text-tertiary uppercase tracking-wider"
      >
        Rejection reason (optional)
      </label>
      <textarea
        id="hitl-reject-reason"
        value={rejectReason}
        disabled={isProcessing}
        onChange={(event) => setRejectReason(event.target.value)}
        placeholder="Tell the agent what needs to change..."
        className="min-h-24 w-full resize-y rounded-lg border border-border bg-surface-strong px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className={approvalActionGroupClassName}>
        <button
          type="button"
          disabled={isProcessing}
          className={approvalActionButtonStyles.reject}
          onClick={() => onReject(rejectReason)}
        >
          Confirm rejection
        </button>
        <button
          type="button"
          disabled={isProcessing}
          className={approvalActionButtonStyles.cancel}
          onClick={setIsRejected}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
