import { useState } from "react";
import Divider from "../../components/Base/Divider";
import { type SideBarItem, sidebarItems } from "./SideBarItems";
import { MyButton } from "../../components/Base/Button";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdFileUpload } from "react-icons/md";
import clsx from "clsx";

type SideBarContainerProps = SideBarItem & {
  selected: boolean;
  onSelect: () => void;
};
export function SideBarContainer({
  label,
  icon: Icon,
  selected = false,
  onSelect,
}: SideBarContainerProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ",
        selected
          ? "bg-blue-50 text-blue-700"
          : "text-slate-700 hover:bg-slate-100"
      )}
    >
      {/* Active indicator */}
      {selected && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-blue-600" />
      )}

      <Icon
        className={clsx(
          "h-5 w-5  transition-colors",
          selected
            ? "text-blue-600"
            : "text-slate-500 group-hover:text-slate-700"
        )}
      />

      <span className="truncate text-sm font-medium">{label}</span>
    </button>
  );
}

export default function SideBar() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex flex-col h-full  gap-y-2 my-4">
      {/* Functions for Handling viewing questions that were created or archived */}
      {sidebarItems.map((v) => (
        <SideBarContainer
          label={v.label}
          key={v.key}
          icon={v.icon}
          onSelect={() => setSelected(v.key)}
          selected={v.key === selected}
        />
      ))}
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
