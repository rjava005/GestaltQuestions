import {
  approvalActionButtonStyles,
  approvalActionFooterClassName,
} from "./ApprovalActions";

export function EditApprovalActions({
  isProcessing,
  onSaveAndApprove,
  onCancel,
}: {
  isProcessing: boolean;
  onSaveAndApprove: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={approvalActionFooterClassName}>
      <button
        type="button"
        disabled={isProcessing}
        className={approvalActionButtonStyles.approve}
        onClick={onSaveAndApprove}
      >
        Save and Approve
      </button>
      <button
        type="button"
        disabled={isProcessing}
        className={approvalActionButtonStyles.cancel}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
