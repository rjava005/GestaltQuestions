import { BsCollection } from "react-icons/bs";
import { FaBoxArchive } from "react-icons/fa6";
import {
  FaRegFileAlt,
  FaRegPaperPlane,
  FaRegQuestionCircle,
} from "react-icons/fa";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdFileUpload } from "react-icons/md";

import { Button } from "../../components/Button/Button";
import Divider from "../../components/Divider/Divider";
import { SideBar, SideBarItem } from "../../components/SideBar";

import {
  type QuestionCollectionView,
  useQuestionCollectionViewContext,
} from "./context";

export const sidebarItems: SideBarItem<QuestionCollectionView>[] = [
  { key: "all", label: "All Questions", icon: BsCollection },
  { key: "current", label: "Current", icon: FaRegQuestionCircle },
  { key: "drafts", label: "Drafts", icon: FaRegFileAlt },
  { key: "published", label: "Published", icon: FaRegPaperPlane },
  { key: "archived", label: "Archived", icon: FaBoxArchive },
] as const;

export default function QuestionBuilderSideBar() {
  const { view, setView } = useQuestionCollectionViewContext();
  return (
    <div className="flex flex-col h-full  gap-y-2 my-4">
      {/* Functions for Handling viewing questions that were created or archived */}
      <SideBar
        options={sidebarItems}
        selected={view}
        setSelected={(val) => {
          console.log("New val", val);
          return setView(val as QuestionCollectionView);
        }}
      />
      <Divider />
      <div className="flex flex-col  gap-y-5 items-center justify-center my-4 w-full">
        <Button
          name="Create"
          className="w-5/10 flex flex-row items-center justify-start gap-x-2 font-bold"
          icon={IoMdAddCircleOutline}
          onClick={() => setView("create")}
        />
      </div>
      <Divider />
    </div>
  );
}
