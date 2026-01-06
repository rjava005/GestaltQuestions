import { type QuestionWorkspaceOptions } from "./types";
import { useQuestionWorkspaceContext } from "./context";
import { SectionItems } from "./config";
import { SectionToolBar } from "../../components/SectionTabs";


export function EditorSections() {
  const {
    option,
    setOption,
    setSplitScreenPanes,
    
  } = useQuestionWorkspaceContext();

  function handleClick(e: React.MouseEvent, pane: string) {
    const isSplitGesture = e.ctrlKey || e.metaKey;
    const option = pane as QuestionWorkspaceOptions;

    if (isSplitGesture) {
      setSplitScreenPanes((prev) => {
        if (prev.includes(option)) {
          return prev.filter((v) => v !== option);
        }
        return [...prev, option];
      });
    } else {
      setOption(option);
    }
    return;
  }

  return (
    <div className="flex flex-row justify-between">
      
      <SectionToolBar
        onClick={(e, option) => handleClick(e, option)}
        options={SectionItems}
        selected={option}
        setSelected={(val) => setOption(val as QuestionWorkspaceOptions)}
      />
    </div>
  );
}
