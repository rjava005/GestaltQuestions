
import clsx from "clsx";

export type SideBarItem<K extends string = string> = {
    key: K;
    label: string;
    icon?: React.ComponentType<any>;
};

export type SideBarItemProps = SideBarItem & {
    selected: boolean;
    onSelect: () => void;
    className?: string;
};

export function SideBarItem({
    label,
    selected = false,
    onSelect,
    icon: Icon,
    className,
}: SideBarItemProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={clsx(
                "group relative flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-accent/60",
                selected
                    ? "border-border-strong bg-surface-strong text-text shadow-soft"
                    : "border-transparent bg-transparent text-text-muted hover:border-border hover:bg-surface-muted hover:text-text",
                className
            )}
        >
            {selected && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-accent" />
            )}

            {Icon && (
                <Icon
                    className={clsx(
                        "h-4.5 w-4.5 shrink-0 transition-colors",
                        selected
                            ? "text-accent"
                            : "text-text-soft group-hover:text-text-muted"
                    )}
                />
            )}
            {!Icon && (
                <span
                    className={clsx(
                        "h-2 w-2 shrink-0 rounded-full",
                        selected ? "bg-accent" : "bg-text-soft/60"
                    )}
                />
            )}

            <span className="truncate text-sm font-medium">{label}</span>
        </button>
    );
}
