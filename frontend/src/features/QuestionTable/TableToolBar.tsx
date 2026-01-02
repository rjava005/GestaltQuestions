// React
import { useMemo, useState } from "react";
import clsx from "clsx";
import { useDebounce } from "@uidotdev/usehooks";
import DropDownAdvance from "../../components/DropDown/DropDownAdvance";

import { ActionButton } from "../../components/Button";
import { SearchBar } from "../../components/SearchBar";

import { useRetrievedQuestions } from "../../hooks";
import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";
import { useQuestionTableContext } from "./QuestionTableContext";
import { ToolBarItems, type ToolBarAction } from "./ToolBarAction";
import { MdRadioButtonChecked } from "react-icons/md";
import { MdRadioButtonUnchecked } from "react-icons/md";

export default function TableToolBar() {
    const [searchTitle, setSearchTitle] = useState<string>("");
    const { multiSelect, setMultiSelect } = useQuestionTableContext();
    const { selectedQuestions } = useQuestionCollectionContext();
    const [showDropDown, setShowDropDown] = useState<boolean>(false);
    const [openDropDown, setOpenDropDown] = useState(true);

    const debouncedSearchTerm = useDebounce(searchTitle, 300);
    const questionFilter = useMemo(
        () => ({ title: debouncedSearchTerm }),
        [debouncedSearchTerm]
    );

    useRetrievedQuestions({
        questionFilter: questionFilter,
        showAllQuestions: false,
    });

    const handleAction = (action: ToolBarAction) => {
        switch (action) {
            case "TOGGLE_MULTI_SELECT":
                setMultiSelect((v) => !v);
                break;

            case "DOWNLOAD":
                console.log("Donwloading");

                break;

            case "DELETE":
                console.log("Deleting");

                break;

            case "SYNC":
                console.log("syncing…");
                break;

            case "TABLE_SETTINGS":
                console.log("open column selector");
                setShowDropDown((prev) => !prev);
                break;
        }
    };

    // Handle the table click
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

    const handleColumnSelect = (val: string) => {
        setSelectedColumns((prev) => {
            if (prev.includes(val)) {
                return prev.filter((v) => v != val);
            } else return [...prev, val];
        });
    };

    console.log("These are the selected columns", selectedColumns);
    return (
        <div
            className={clsx(
                "w-full grow",
                "grid grid-rows-2 gap-5 p-4",
                "rounded-lg bg-white dark:bg-gray-900 shadow-sm",
                "border border-gray-200 dark:border-gray-700"
            )}
        >
            <div className="col-span-2">
                <SearchBar
                    value={searchTitle}
                    setValue={setSearchTitle}
                    disabled={false}
                />
            </div>
            {/* Question tool bar such as deleting, downloading etc */}
            <div className="flex flex-row wrap w-full justify-between gap-4">
                {ToolBarItems.map((item) => {
                    const disabled = item.multiSelect && selectedQuestions.length === 0;

                    if (item.multiSelect && !multiSelect) return null;

                    if (item.kind === "button")
                        return (
                            <ActionButton
                                key={item.label}
                                label={item.label}
                                icon={item.icon}
                                disabled={disabled}
                                onClick={() => handleAction(item.action)}
                            />
                        );
                    else if (item.kind === "dropdown")
                        return (
                            <>
                                <ActionButton
                                    key={item.label}
                                    label={item.label}
                                    icon={item.icon}
                                    disabled={disabled}
                                    onClick={() => handleAction(item.action)}
                                ></ActionButton>
                                {showDropDown && (
                                    <DropDownAdvance
                                        options={item.items.map((v) => {
                                            return {
                                                value: v.key,
                                                label: v.label,
                                                icon: selectedColumns.includes(v.key)
                                                    ? MdRadioButtonChecked
                                                    : MdRadioButtonUnchecked,
                                            };
                                        })}
                                        label=""
                                        selected={""}
                                        setSelected={(v) => handleColumnSelect(v)}
                                        open={openDropDown}
                                        onOpenChange = {setOpenDropDown}
                                    />
                                )}
                            </>
                        );
                })}
            </div>
        </div>
    );
}
