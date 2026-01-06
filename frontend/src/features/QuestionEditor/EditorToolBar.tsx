import { ActionButton } from "../../components/Button";
import { EditorToolBarItems } from "./config";
import type { FileActions, FileOptions } from "./types";
import {
  useSaveQuestionFile,
  useDeleteQuestionFile,
  useDownloadFile,
} from "./hooks";
import { useCodeEditorContext } from "./context";
import { useQuestionCollectionContext } from "./../../context/QuestionCollectionContext";
import { Modal } from "../../components/Modal";
import { UploadFilesToQuestion } from "./UploadFilesToQuestion";
import { useState } from "react";

export default function FileToolBar() {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const { selectedFile, fileContent, setRefreshKey } = useCodeEditorContext();
  const { selectedQuestionID } = useQuestionCollectionContext();
  const { saveFile } = useSaveQuestionFile(() =>
    setRefreshKey((prev) => prev + 1)
  );
  const { deleteFile } = useDeleteQuestionFile(() =>
    setRefreshKey((prev) => prev + 1)
  );
  const { downloadFile } = useDownloadFile(() =>
    setRefreshKey((prev) => prev + 1)
  );
  const handleOption = async (action: FileActions, options: FileOptions) => {
    switch (action) {
      case "save":
        if (!options.questionID || !options.filename) {
          return;
        }
        await saveFile(
          options.questionID,
          options.filename,
          options.fileContent ?? ""
        );
        break;

      case "upload":
        setShowUploadModal((prev) => !prev);
        break;

      case "delete":
        if (!options.questionID || !options.filename) {
          return;
        }
        await deleteFile(options.questionID, options.filename);
        break;

      case "download":
        if (!options.questionID || !options.filename) {
          return;
        }
        await downloadFile(options.filename, options.questionID);
        break;

      default: {
        // This should be unreachable because EditorOptions is exhaustive
        const _exhaustiveCheck: never = action;
        console.warn("Unhandled editor option:", _exhaustiveCheck);
      }
    }
  };

  return (
    <div className="flex flex-row gap-2">
      {EditorToolBarItems.map((v) => (
        <ActionButton
          icon={v.icon}
          label={v.label}
          key={v.key}
          onClick={() =>
            handleOption(v.key, {
              questionID: selectedQuestionID,
              filename: selectedFile,
              fileContent: fileContent,
            })
          }
        />
      ))}
      {showUploadModal && (
        <Modal setShowModal={setShowUploadModal}>
          <UploadFilesToQuestion questionID={selectedQuestionID} />
        </Modal>
      )}
    </div>
  );
}


export function CodeOptions() {

}