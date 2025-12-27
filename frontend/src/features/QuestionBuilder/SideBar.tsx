import Divider from "../../components/Base/Divider";
import { MyButton } from "../../components/Base/Button";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdFileUpload } from "react-icons/md";
import {
  useQuestionCollectionContext,
  type QuestionCollectionFilter,
} from "./QuestionCollectionContext";
import { SideBarItem, SideBar } from "../../components/SideBar";

import { FaBoxArchive } from "react-icons/fa6";
import { BsCollection } from "react-icons/bs";

import {
  FaRegQuestionCircle,
  FaRegFileAlt,
  FaRegPaperPlane,
} from "react-icons/fa";

export const sidebarItems: SideBarItem<QuestionCollectionFilter>[] = [
  { key: "all", label: "All Questions", icon: BsCollection },
  { key: "current", label: "Current", icon: FaRegQuestionCircle },
  { key: "drafts", label: "Drafts", icon: FaRegFileAlt },
  { key: "published", label: "Published", icon: FaRegPaperPlane },
  { key: "archived", label: "Archived", icon: FaBoxArchive },
] as const;

export default function QuestionBuilderSideBar() {
  const { filter, setFilter } = useQuestionCollectionContext();
  return (
    <div className="flex flex-col h-full  gap-y-2 my-4">
      {/* Functions for Handling viewing questions that were created or archived */}
      <SideBar
        options={sidebarItems}
        selected={filter}
        setSelected={(val) => setFilter(val as QuestionCollectionFilter)}
      />
      <Divider />
      <div className="flex flex-col  gap-y-5 items-center justify-center my-4 w-full">
        <MyButton
          name="Create"
          className="w-5/10 flex flex-row items-center justify-start gap-x-2 font-bold"
          icon={IoMdAddCircleOutline}
        />

        <MyButton
          name="Upload"
          className="w-5/10 flex flex-row items-center justify-start gap-x-2 font-bold"
          color="showSolution"
          icon={MdFileUpload}
        />
      </div>
      <Divider />
    </div>
  );
}
