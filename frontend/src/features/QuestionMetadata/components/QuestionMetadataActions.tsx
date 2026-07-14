import { RotateCcw, Save } from "lucide-react";

type QuestionMetadataActionsProps = {
  onReset: () => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function QuestionMetadataActions({
  onReset,
  onSubmit,
  disabled = false,
}: QuestionMetadataActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-1">
      <button
        type="button"
        onClick={() => onReset()}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-border-strong hover:text-text"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset
      </button>

      <button
        type="button"
        onClick={() => onSubmit()}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        Save Changes
      </button>
    </div>
  );
}
