import { useCallback, useId } from "react";
import { type DropDownBase } from "./types";

type DropDownProps = DropDownBase & {
    options: string[];
};

export default function DropDown({
    options,
    selected,
    setSelected,
    label = "Drop Down",
}: DropDownProps) {
    const selectId = useId();

    const handleDropDownChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            setSelected(event.target.value);
        },
        [setSelected],
    );

    return (
        <div className="w-full flex flex-col gap-2">
            <label
                htmlFor={selectId}
                className="text-sm font-semibold text-text-muted"
            >
                {label}
            </label>

            <div className="relative">
                <select
                    id={selectId}
                    name={selectId}
                    value={selected}
                    onChange={handleDropDownChange}
                    className="
                        w-full appearance-none rounded-md
                        border border-border
                        bg-surface-strong text-text
                        px-3 py-2.5 pr-10 text-sm
                        shadow-sm transition-all duration-(--duration-base) ease-base
                        hover:border-border-strong
                        focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
                    "
                >
                    {options.map((v) => {
                        const cleaned = v.trim();
                        return (
                            <option
                                key={cleaned}
                                value={cleaned}
                                className="bg-surface-strong text-text"
                            >
                                {cleaned}
                            </option>
                        );
                    })}
                </select>

                <span
                    aria-hidden="true"
                    className="
                        pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                        text-text-soft text-xs
                    "
                >
                    ▼
                </span>
            </div>
        </div>
    );
}
