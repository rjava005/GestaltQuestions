import { Button } from "../Button";

export default function ShowUploadedFiles({
  files,
  onRemove,
  onSubmit,
}: {
  files: File[];
  onRemove: (index: number) => void;
  onSubmit?: () => void;
}) {
  return (
    <div className="mt-3 rounded-md border border-border bg-surface p-3">
      <div className="mb-2 text-sm font-medium text-text">Selected files</div>

      {files.length === 0 ? (
        <div className="text-sm text-text-muted">No files selected yet.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-strong px-3 py-1 text-sm text-text"
            >
              <span className="max-w-[260px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="rounded px-1 text-text-muted hover:text-red-400"
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {onSubmit && (
        <div className="mt-3">
          <Button
            name="Upload"
            onClick={onSubmit}
            disabled={files.length === 0}
          />
        </div>
      )}
    </div>
  );
}
