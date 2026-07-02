import type { IconType } from "react-icons";
import { BsShieldFillCheck } from "react-icons/bs";
import { FaPencilAlt } from "react-icons/fa";
import { MdCancel } from "react-icons/md";

type ApprovalCardHeaderMode = "editing" | "rejection" | "review";

interface ApprovalCardHeaderProps {
  mode: ApprovalCardHeaderMode;
}

const modeIcons = {
  editing: FaPencilAlt,
  rejection: MdCancel,
  review: BsShieldFillCheck,
} satisfies Record<ApprovalCardHeaderMode, IconType>;

const modeMessages = {
  editing: "Editing Request",
  rejection: "Reject Request",
  review: "Review Required",
} satisfies Record<ApprovalCardHeaderMode, string>;

export function ApprovalCardHeader({ mode }: ApprovalCardHeaderProps) {
  const Icon = modeIcons[mode];
  const message = modeMessages[mode];

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-secondary">
      <Icon className="text-text-muted" />
      <span className="text-sm font-medium text-text">{message}</span>
      <span className="ml-auto rounded-full border border-warning-border bg-warning-muted px-2 py-0.5 text-[11px] font-medium text-warning">
        Awaiting Approval
      </span>
    </div>
  );
}
