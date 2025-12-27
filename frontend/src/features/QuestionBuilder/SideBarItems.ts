import { FaBoxArchive } from "react-icons/fa6";
import { BsCollection } from "react-icons/bs";
import { type IconType } from "react-icons";
import {
  FaRegQuestionCircle,
  FaRegFileAlt,
  FaRegPaperPlane,
} from "react-icons/fa";

export type SideBarItem = {
  key: string;
  label: string;
  icon: IconType;
};

export const sidebarItems: SideBarItem[] = [
  { key: "all_questions", label: "All Questions", icon: BsCollection },
  {
    key: "current",
    label: "Current",
    icon: FaRegQuestionCircle, // active question being edited
  },
  {
    key: "drafts",
    label: "Drafts",
    icon: FaRegFileAlt, // questions in draft state
  },
  {
    key: "published",
    label: "Published",
    icon: FaRegPaperPlane, // published questions
  },
  {
    key: "archived",
    label: "Archived",
    icon: FaBoxArchive, // archived questions
  },
] as const;
