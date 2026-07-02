import type { ActionRequest, ReviewConfig } from "langchain";
import { useState } from "react";

import { ApprovalActions } from "./ApprovalActions";
import { ApprovalCardContainer } from "./ApprovalCardContainer";
import { ApprovalCardDescription } from "./ApprovalCardDescription";
import { ApprovalCardHeader } from "./ApprovalCardHeader";
import { EditApprovalActions } from "./EditApprovalActions";
import { RejectReasonInput } from "./RejectReasonInput";

interface ApprovalCardProps {
  actionRequest: ActionRequest;
  reviewConfig?: ReviewConfig;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: (editedArgs: Record<string, unknown>) => void;
  isProcessing: boolean;
}

export function ApprovalCard({
  actionRequest,
  reviewConfig,
  onApprove,
  onReject,
  onEdit,
  isProcessing,
}: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArgs, setEditedArgs] = useState<Record<string, unknown>>(
    actionRequest.args,
  );
  const [originalArgs, setOriginalArgs] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);

  const allowed = reviewConfig?.allowedDecisions ?? ["approve", "reject"];

  function startEditing() {
    setOriginalArgs({ ...editedArgs });
    setIsEditing(true);
  }

  function cancelEditing() {
    if (originalArgs) {
      setEditedArgs(originalArgs);
    }

    setOriginalArgs(null);
    setIsEditing(false);
  }

  const approvalHeaderMode = isEditing
    ? "editing"
    : showRejectInput
      ? "rejection"
      : "review";

  return (
    <ApprovalCardContainer>
      <ApprovalCardHeader mode={approvalHeaderMode} />
      <ApprovalCardDescription
        name={actionRequest.name}
        description={actionRequest.description}
        args={editedArgs}
        isEditing={isEditing}
        onArgsChange={setEditedArgs}
      />
      {!showRejectInput && !isEditing ? (
        <ApprovalActions
          allowed={allowed}
          onApprove={onApprove}
          isProcessing={isProcessing}
          setIsEditing={startEditing}
          setIsRejected={() => setShowRejectInput((prev) => !prev)}
        />
      ) : null}
      {showRejectInput && (
        <RejectReasonInput
          onReject={onReject}
          isProcessing={isProcessing}
          setIsRejected={() => setShowRejectInput((prev) => !prev)}
        />
      )}
      {isEditing && (
        <EditApprovalActions
          isProcessing={isProcessing}
          onSaveAndApprove={() => onEdit(editedArgs)}
          onCancel={cancelEditing}
        />
      )}
    </ApprovalCardContainer>
  );
}
