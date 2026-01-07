
import clsx from "clsx";

export type SideBarItem<K extends string = string> = {
    key: K;
    label: string;
    icon: React.ComponentType<any>;
};

export type SideBarItemProps = SideBarItem & {
    selected: boolean;
    onSelect: () => void;
    style?: string;
};

export function SideBarItem({
    label,
    key,
    selected = false,
    onSelect,
    icon: Icon,
}: SideBarItemProps) {
    return (
        <button
            type="button"
            key={key}
            onClick={onSelect}
            className={clsx(
                "group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ",
                selected
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
            )}
        >
            {/* Active indicator */}
            {selected && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-blue-600" />
            )}

            {Icon && (
                <Icon
                    className={clsx(
                        "h-5 w-5  transition-colors",
                        selected
                            ? "text-blue-600"
                            : "text-slate-500 group-hover:text-slate-700"
                    )}
                />
            )}

            <span className="truncate text-sm font-medium">{label}</span>
        </button>
    );
}
