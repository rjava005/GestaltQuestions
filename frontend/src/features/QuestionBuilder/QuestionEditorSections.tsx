import clsx from "clsx";
import { useState } from "react";
import { MyButton } from "../../components/Base/Button";
import { IoMdAddCircleOutline } from "react-icons/io";
import { CiCircleMinus } from "react-icons/ci";
type SectionType =
    | "Question View"
    | "Code Editor"
    | "Question Metadata"
    | "Question Solution";

const Sections: SectionType[] = [
    "Code Editor",
    "Question Metadata",
    "Question Solution",
    "Question View",
];

type SectionProps = {
    label: SectionType;
    selected: boolean;
    setSelected: (val: string) => void;
};

function SectionTab({ label, selected, setSelected }: SectionProps) {
    return (
        <button
            type="button"
            onClick={() => setSelected(label)}
            className={clsx(
                "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "focus:ring-offset-white dark:focus:ring-offset-slate-900",

                selected
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            )}
        >
            {label}
        </button>
    );
}

export function QuestionEditorSections() {
    const [selected, setSelected] = useState<SectionType | null>(null);
    const [sections, setSections] = useState<SectionType[]>(["Question View"]);
    const [showOptions, setShowOptions] = useState(false);

    return (
        <nav
            id="question-editor-sections"
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
                        key={s}
                        label={s}
                        selected={s === selected}
                        setSelected={() => setSelected(s)}
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
                                prev.filter((section) => section !== selected)
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
                        {Sections.filter((v) => !sections.includes(v)).map((v) => (
                            <button
                                key={v}
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
                                {v}
                            </button>
                        ))}

                        {Sections.every((v) => sections.includes(v)) && (
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
