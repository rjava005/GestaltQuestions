import type { ToolBarItem } from "../../types";
import { IoIosSave } from "react-icons/io";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import { MdFileUpload } from "react-icons/md";
import type { FileActions } from "./types";

export const EditorToolBarItems: ToolBarItem<FileActions>[] = [
  {
    key: "save",
    label: "Save",
    color: "",
    icon: IoIosSave,
  },
  {
    key: "upload",
    label: "Upload File",
    color: "",
    icon: MdFileUpload,
  },
  {
    key: "download",
    label: "Download File",
    color: "",
    icon: FiDownload,
  },
  {
    key: "delete",
    label: "Delete File",
    color: "",
    icon: FiTrash2,
  },
];
