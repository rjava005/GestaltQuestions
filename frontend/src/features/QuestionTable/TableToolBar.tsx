// React
import { useMemo, useState } from "react";

// Third-party libraries
import clsx from "clsx";
import { useDebounce } from "@uidotdev/usehooks";

// Components
import { ActionButton } from "../../components/Button";
import { SearchBar } from "../../components/SearchBar";

// Hooks
import { useRetrievedQuestions } from "../../hooks";

// Context
import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";
import { useQuestionTableContext } from "./QuestionTableContext";

// Local configuration / types
import { ToolBarItems, type ToolBarAction } from "./ToolBarAction";

// Configuration for the toolbar

export default function TableToolBar() {
    const [searchTitle, setSearchTitle] = useState<string>("");
    const { multiSelect, setMultiSelect } = useQuestionTableContext();
    const { selectedQuestions } = useQuestionCollectionContext();

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
                break;
        }
    };
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
                    else {
                        return (
                            <ActionButton
                                key={item.label}
                                label={item.label}
                                icon={item.icon}
                                disabled={disabled}
                                onClick={() => handleAction(item.action)}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
}
