import clsx from "clsx";

export type ServerSettings = "static" | "javascript" | "python";

type ServerModeSwitchProps = {
    value: ServerSettings;
    onChange: (next: ServerSettings) => void;
};

const modes: ServerSettings[] = ["javascript", "python"];

export function ServerModeSwitch({ value, onChange }: ServerModeSwitchProps) {
    return (
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            {modes.map((mode) => {
                const active = mode === value;
                return (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => onChange(mode)}
                        className={clsx(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            active
                                ? "bg-surface-strong text-accent border border-border-strong"
                                : "text-text-muted hover:bg-surface-muted"
                        )}
                    >
                        {mode}
                    </button>
                );
            })}
        </div>
    );
}