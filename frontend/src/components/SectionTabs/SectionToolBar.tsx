import { useState } from "react";
import { MyButton } from "../../components/Base/Button";
import { IoMdAddCircleOutline } from "react-icons/io";
import { CiCircleMinus } from "react-icons/ci";
import { SectionTab, type SectionItem } from "../../components/SectionTabs";

type SectionToolBarProps = {
    options: SectionItem[];
    selected: string;
    setSelected: (val: string) => void;
    id?: string;
};

export default function SectionToolBar({
    options,
    selected,
    setSelected,
    id,
}: SectionToolBarProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [sections, setSections] = useState<SectionItem[]>([options[0]]);

    return (
        <nav
            id={id ?? "section-tool-bar"}
            className="
        flex w-full items-center justify-between gap-4
        border-b border-slate-200 px-3 py-2
        dark:border-slate-700
      "
        >
            {/* LEFT: Section Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto">
                {sections.map((s) => (
                    <SectionTab
                        key={s.key}
                        label={s.label}
                        selected={s.key === selected}
                        setSelected={() => setSelected(s.key)}
                    />
                ))}
            </div>

            {/* RIGHT: Controls */}
            <div className="relative flex items-center gap-2">
                {/* Add Section */}
                <MyButton
                    icon={IoMdAddCircleOutline}
                    name="Add section"
                    onClick={() => setShowOptions((prev) => !prev)}
                />
                {/* Remove Section */}
                {selected && (
                    <MyButton
                        icon={CiCircleMinus}
                        name="Hide section"
                        color="danger"
                        onClick={() =>
                            setSections((prev) =>
                                prev.filter((section) => section.key !== selected)
                            )
                        }
                    />
                )}
                {/* Dropdown */}
                {showOptions && (
                    <div
                        className="
              absolute right-0 top-full z-20 mt-2 w-48
              rounded-lg border border-slate-200 bg-white shadow-lg
              dark:border-slate-700 dark:bg-slate-800
            "
                    >
                        {options
                            .filter((v) => !sections.includes(v))
                            .map((v) => (
                                <button
                                    key={v.key}
                                    type="button"
                                    onClick={() => {
                                        setSections((prev) => [...prev, v]);
                                        setShowOptions(false);
                                    }}
                                    className="
                  block w-full px-4 py-2 text-left text-sm
                  text-slate-700 hover:bg-slate-100
                  dark:text-slate-200 dark:hover:bg-slate-700
                "
                                >
                                    {v.label}
                                </button>
                            ))}

                        {options.every((v) => sections.includes(v)) && (
                            <div className="px-4 py-2 text-sm text-slate-400">
                                All sections added
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
