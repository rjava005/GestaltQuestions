function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

const approvalArgInputClassName =
  "w-full rounded-lg border border-border bg-surface-strong px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-60";

export function ApprovalCardDescription({
  name,
  description,
  args,
  isEditing,
  onArgsChange,
}: {
  name: string;
  description?: string;
  args: Record<string, unknown>;
  isEditing: boolean;
  onArgsChange: (args: Record<string, unknown>) => void;
}) {
  function handleArgChange(key: string, value: string) {
    onArgsChange({
      ...args,
      [key]: value,
    });
  }

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-lg bg-surface-tertiary border border-border p-3">
        <code className="text-sm font-mono font-semibold text-text">
          {name}
        </code>
        {description && (
          <p className="text-xs text-text-tertiary mt-1">{description}</p>
        )}

        <div className="mt-2.5 space-y-2">
          {Object.entries(args).map(([key, value]) => {
            const strValue = formatValue(value);
            const isMultiline = strValue.includes("\n");

            return (
              <div key={key}>
                <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-0.5">
                  {key}
                </div>
                {isEditing ? (
                  isMultiline ? (
                    <textarea
                      className={`${approvalArgInputClassName} min-h-24 resize-y font-mono`}
                      value={strValue}
                      onChange={(event) =>
                        handleArgChange(key, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      className={approvalArgInputClassName}
                      value={strValue}
                      onChange={(event) =>
                        handleArgChange(key, event.target.value)
                      }
                    />
                  )
                ) : isMultiline ? (
                  <pre className="text-sm text-text whitespace-pre-wrap wrap-break-word font-mono bg-surface rounded-md px-2.5 py-1.5 border border-border">
                    {strValue}
                  </pre>
                ) : (
                  <div className="text-sm text-text wrap-break-word">
                    {strValue}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
