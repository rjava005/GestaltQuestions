import { FaPencilAlt, FaTrashAlt } from "react-icons/fa";

import { SideBarMenu } from "../../../components/SideBar";
import type { ThreadRead as Thread } from "../../../services/Chat";
import { useThreadStore } from "../instance/store";

type ThreadMenuItemProps = {
  thread: Thread;
};

export default function ThreadMenuItem({ thread }: ThreadMenuItemProps) {
  const setThreadId = useThreadStore((s) => s.setThreadId);

  return (
    <SideBarMenu.Item
      item={thread}
      label={thread.id}
      onSelect={(selectedThread) => setThreadId(selectedThread.id)}
      actions={[
        {
          label: "Rename",
          icon: FaPencilAlt,
          onClick: (selectedThread) => console.log("Rename", selectedThread.id),
        },
        {
          label: "Delete",
          icon: FaTrashAlt,
          onClick: (selectedThread) => console.log("Delete", selectedThread.id),
        },
      ]}
    />
  );
}
