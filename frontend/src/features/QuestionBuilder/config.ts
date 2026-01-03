import { BsCollection } from "react-icons/bs";
import { FaBoxArchive } from "react-icons/fa6";
import {
  FaRegFileAlt,
  FaRegPaperPlane,
  FaRegQuestionCircle,
} from "react-icons/fa";

import { SideBarItem } from "../../components/SideBar";
import { type QuestionCollectionView } from "../QuestionBuilder";

export const sidebarItems: SideBarItem<QuestionCollectionView>[] = [
  { key: "all", label: "All Questions", icon: BsCollection },
  { key: "current", label: "Current", icon: FaRegQuestionCircle },
  { key: "drafts", label: "Drafts", icon: FaRegFileAlt },
  { key: "published", label: "Published", icon: FaRegPaperPlane },
  { key: "archived", label: "Archived", icon: FaBoxArchive },
] as const;
