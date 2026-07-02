import clsx from "clsx";
import type { ReviewConfig } from "langchain";

type AllowedDecisions = NonNullable<ReviewConfig["allowedDecisions"]>;
type ApprovalActionButtonVariant = AllowedDecisions[number] | "cancel";
type HITLButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  label: string;
  variant: ApprovalActionButtonVariant;
};

const approvalActionButtonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-bg " +
  "disabled:cursor-not-allowed disabled:opacity-40";

export const approvalActionGroupClassName = "flex flex-wrap items-center gap-2";

export const approvalActionFooterClassName = `${approvalActionGroupClassName} border-t border-border bg-surface-secondary px-4 py-3`;

export const approvalActionButtonStyles = {
  approve:
    approvalActionButtonBase +
    " border-approval-border bg-approval-muted text-approval hover:bg-approval hover:text-approval-foreground",
  edit:
    approvalActionButtonBase +
    " border-border-strong bg-surface-strong text-text hover:bg-surface-muted",
  reject:
    approvalActionButtonBase +
    " border-warning-border bg-warning-muted text-warning hover:bg-warning hover:text-warning-foreground",
  cancel:
    approvalActionButtonBase +
    " border-border bg-button-secondary text-text-muted hover:border-border-strong hover:bg-surface-muted hover:text-text",
} satisfies Record<ApprovalActionButtonVariant, string>;

export function HITLButton({ label, variant, ...rest }: HITLButtonProps) {
  return (
    <button className={clsx(approvalActionButtonStyles[variant])} {...rest}>
      {label}
    </button>
  );
}

export function ApprovalActions({
  allowed,
  isProcessing,
  setIsEditing,
  setIsRejected,
  onApprove,
}: {
  allowed: AllowedDecisions;
  isProcessing: boolean;
  onApprove: () => void;
  setIsRejected: () => void;
  setIsEditing: () => void;
}) {
  const canApprove = allowed.includes("approve");
  const canEdit = allowed.includes("edit");
  const canReject = allowed.includes("reject");

  return (
    <div className={approvalActionFooterClassName}>
      {canApprove && (
        <button
          type="button"
          disabled={isProcessing}
          className={approvalActionButtonStyles.approve}
          onClick={onApprove}
        >
          Approve
        </button>
      )}
      {canEdit && (
        <button
          type="button"
          disabled={isProcessing}
          className={approvalActionButtonStyles.edit}
          onClick={setIsEditing}
        >
          Edit
        </button>
      )}
      {canReject && (
        <button
          type="button"
          disabled={isProcessing}
          className={approvalActionButtonStyles.reject}
          onClick={setIsRejected}
        >
          Reject
        </button>
      )}
    </div>
  );
}
