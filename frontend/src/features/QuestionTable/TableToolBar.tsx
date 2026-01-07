import { useMemo, useState } from "react";

import clsx from "clsx";
import { useDebounce } from "@uidotdev/usehooks";

import { MdRadioButtonChecked, MdRadioButtonUnchecked } from "react-icons/md";

import DropDownAdvance from "../../components/DropDown/DropDownAdvance";
import { ActionButton } from "../../components/Button";
import { SearchBar } from "../../components/SearchBar";

import { useRetrievedQuestions } from "../../hooks";
import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";

import { useQuestionTableContext } from "./context";
import { useQuestionToolBarActions } from "./hooks";
import { QuestionTableColumns, ToolBarItems } from "./config";
import type { ToolBarAction } from "./types";

export default function TableToolBar() {
  const [searchTitle, setSearchTitle] = useState<string>("");
  const {
    multiSelect,
    setMultiSelect,
    columns: selectedColumns,
    setColumns: setSelectedColumns,
  } = useQuestionTableContext();
  const { selectedQuestions } = useQuestionCollectionContext();
  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  const [openDropDown, setOpenDropDown] = useState(true);

  const debouncedSearchTerm = useDebounce(searchTitle, 300);
  const questionFilter = useMemo(
    () => ({ title: debouncedSearchTerm }),
    [debouncedSearchTerm]
  );

  const { handleQuestionDownloads, handleDeleteQuestions } =
    useQuestionToolBarActions();

  useRetrievedQuestions({
    questionFilter: questionFilter,
    showAllQuestions: false,
  });

  const handleAction = async (action: ToolBarAction) => {
    switch (action) {
      case "TOGGLE_MULTI_SELECT":
        setMultiSelect((v) => !v);
        break;

      case "DOWNLOAD":
        await handleQuestionDownloads();
        break;

      case "DELETE":
        await handleDeleteQuestions();

        break;

      case "SYNC":
        console.log("syncing…");
        break;

      case "TABLE_SETTINGS":
        setShowDropDown((prev) => !prev);
        break;
    }
  };

  const handleColumnSelect = (key: string) => {
    setSelectedColumns((prev) => {
      const exists = prev.some((col) => col.key === key);
      if (exists) {
        return prev.filter((col) => col.key !== key);
      }
      const column = QuestionTableColumns.find((col) => col.key === key);
      if (!column) {
        console.warn("Column not found:", key);
        return prev;
      }

      return [...prev, column];
    });
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
          // This is the settings
          else if (item.kind === "dropdown")
            return (
              <div className="relative w-full">
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
                        icon: selectedColumns.find((q) => q.key === v.key)
                          ? MdRadioButtonChecked
                          : MdRadioButtonUnchecked,
                      };
                    })}
                    label=""
                    selected={""}
                    setSelected={(v) => handleColumnSelect(v)}
                    open={openDropDown}
                    onOpenChange={setOpenDropDown}
                    className="absolute top-0"
                  />
                )}
              </div>
            );
        })}
      </div>
    </div>
  );
}
