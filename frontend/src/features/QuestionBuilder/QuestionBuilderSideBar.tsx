import { IoMdAddCircleOutline } from "react-icons/io";

import { Button } from "../../components/Button";
import { Divider } from "../../components/Divider";
import { SideBar } from "../../components/SideBar";

import { sidebarItems } from "./config";
import {
  type QuestionCollectionView,
  useQuestionCollectionViewContext,
} from "./context";

export default function QuestionBuilderSideBar() {
  const { view, setView } = useQuestionCollectionViewContext();
  return (
    <div className="flex flex-col h-full  gap-y-2 my-4">
      {/* Functions for Handling viewing questions that were created or archived */}
      <SideBar
        options={sidebarItems}
        selected={view}
        setSelected={(val) => {
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
