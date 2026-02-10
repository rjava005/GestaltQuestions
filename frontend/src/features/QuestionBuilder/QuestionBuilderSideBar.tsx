import { IoMdAddCircleOutline } from "react-icons/io";
import { NavLink } from "react-router-dom";
import { Button } from "../../components/Button";
import { Divider } from "../../components/Divider";
import { SideBarItem } from "../../components/SideBar";
import { useNavigate } from "react-router-dom";
import { sidebarItems } from "./config";
import { useQuestionCollectionViewContext } from "./context";

export default function QuestionBuilderSideBar() {
  const { view, setView } = useQuestionCollectionViewContext();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full  gap-y-2 my-4">
      {/* Functions for Handling viewing questions that were created or archived */}
      {sidebarItems.map((v) => {
        return (
          <NavLink to={v.key}>
            <SideBarItem
              label={v.label}
              key={v.key}
              icon={v.icon}
              onSelect={() => setView(v.key)}
              selected={v.key === view}
            />
          </NavLink>
        );
      })}

      <Divider />
      <div className="flex flex-col  gap-y-5 items-center justify-center my-4 w-full">
        <Button
          name="Create"
          className="w-5/10 flex flex-row items-center justify-start gap-x-2 font-bold"
          icon={IoMdAddCircleOutline}
          onClick={() => {
            setView("create");
            return navigate("/question_builder/create");
          }}
        />
      </div>

      <Divider />
    </div>
  );
}
