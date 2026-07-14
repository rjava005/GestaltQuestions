import { Button } from "../Button";

type ShowUploadedFilesVariant = "default" | "editorPanel";

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileBadge = (file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return "bg-approval-muted text-approval";
  }

  if (ext === "pdf") {
    return "bg-red-500/15 text-red-300";
  }

  return "bg-accent/15 text-accent";
};

export default function ShowUploadedFiles({
  files,
  onRemove,
  onSubmit,
  variant = "default",
}: {
  files: File[];
  onRemove: (index: number) => void;
  onSubmit?: () => void;
  variant?: ShowUploadedFilesVariant;
}) {
  if (variant === "editorPanel") {
    return (
      <div className="rounded-lg border border-border bg-surface-strong p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-text">
          <span>Attached files ({files.length})</span>
        </div>

        {files.length === 0 ? (
          <div className="rounded-md border border-border bg-code/60 px-3 py-4 text-sm text-text-muted">
            No files selected yet.
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-code/70 px-3 py-2 text-sm text-text"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${getFileBadge(file)}`}
                >
                  {file.name.split(".").pop()?.slice(0, 3).toUpperCase() ??
                    "FILE"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {file.name}
                </span>
                <span className="shrink-0 font-mono text-xs text-text-soft">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="shrink-0 rounded px-1 text-lg leading-none text-text-muted hover:text-red-300"
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
              color="editorAction"
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  }

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
