import { useState, useMemo } from "react";

import { useDebounce } from "@uidotdev/usehooks";
import { useRetrievedQuestions } from "../../hooks";
import { useQuestionTableContext } from "../../features/QuestionTable/context";
import { useQuestionToolBarActions } from "../../features/QuestionTable/hooks";

import clsx from "clsx";
import { ActionButton } from "../Button";


import SearchBar from "../SearchBar/SearchBar";
import { Modal } from "../Modal";

import UploadZipQuestionModal from "../../features/CreateQuestion/UploadZipQuestionModal";



export default function QuestionViewToolBar() {
  const { multiSelect, setMultiSelect } = useQuestionTableContext();
  const { handleDeleteQuestions, handleQuestionDownloads } =
    useQuestionToolBarActions();
  const [searchTitle, setSearchTitle] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTitle, 300);

  const questionFilter = useMemo(
    () => ({ title: debouncedSearchTerm }),
    [debouncedSearchTerm]
  );

  useRetrievedQuestions({
    questionFilter: questionFilter,
    showAllQuestions: false,
  });

  return (
    <div
      className={clsx(
        "w-full grow",
        "grid grid-rows-2 gap-5 p-4",
        "rounded-lg bg-white dark:bg-gray-900 shadow-sm",
        "border border-gray-200 dark:border-gray-700"
      )}
    >
      {/* Top Row — Search + Mode Toggle */}
      <div className="grid grid-cols-3 gap-4 items-center justify-evenly">
        <div className="col-span-2">
          <SearchBar
            value={searchTitle}
            setValue={setSearchTitle}
            disabled={false}
          />
        </div>

        <ActionButton
          icon={BiSelectMultiple}
          label="Multi-Select"
          className="justify-self-end max-w-[200px]"
          onClick={() => setMultiSelect((prev) => !prev)}
        />
      </div>

      <ActionButton
        icon={MdFileUpload}
        label="Upload Question"
        onClick={() => setShowModal((prev) => !prev)}
      />

      {/* Bottom Row — Action Buttons */}
      {multiSelect && (
        <div className="grid grid-cols-2 gap-4">
          <ActionButton
            icon={MdDelete}
            label="Delete Question"
            onClick={handleDeleteQuestions}
          />
          <ActionButton
            icon={IoMdDownload}
            label="Download Question"
            onClick={handleQuestionDownloads}
          />
        </div>
      )}

      {showModal && (
        <Modal setShowModal={setShowModal}>
          <UploadZipQuestionModal setShowModal={setShowModal} />
        </Modal>
      )}
    </div>
  );
}
