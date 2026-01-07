import { Header } from "../../components/Header";
import { EditorSections } from "./EditorSections";
import { useQuestionWorkspaceContext } from "./context";
import { QuestionEngine } from "../QuestionEngine";
import { QuestionEditor } from "../QuestionEditor";
import { getCurrentQuestionMetadata } from "../QuestionEngine";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { QuestionWorkspaceOptions } from "./types";
import React from "react";
import { ToggleField } from "../../components/Toggles";

const PaneComponentMap: Record<QuestionWorkspaceOptions, React.ReactNode> = {
  code: <QuestionEditor />,
  question: <QuestionEngine />,
  solution: <div>Solution</div>,
  metadata: <div>Metadata</div>,
};

export default function QuestionWorkspace() {
  const {
    option,
    splitScreenPanes,
    splitScreenEnabled,
    setSplitScreenEnabled,
  } = useQuestionWorkspaceContext();
  const { questionMeta } = getCurrentQuestionMetadata();

  const panesToRender = splitScreenEnabled
    ? splitScreenPanes.length
      ? splitScreenPanes
      : [option]
    : [option];
  return (
    <div className="flex flex-col">
      <Header title={questionMeta?.title ?? "No Question Selected"} />
      <div className="my-2">
        <ToggleField
          label="Enable Split Screen"
          id="split-screen-toggle"
          checked={splitScreenEnabled}
          setToggle={() => setSplitScreenEnabled((prev) => !prev)}
        />
      </div>
      <EditorSections />
      <div className="w-full h-8/10">
        <PanelGroup
          autoSaveId="conditional"
          direction="horizontal"
          className="flex w-full h-full overflow-hidden 
                   rounded-lg border border-gray-300 dark:border-gray-700"
        >
          {panesToRender.map((v, index, arr) => (
            <React.Fragment key={`${v}-${index}`}>
              <Panel
                order={index + 1}
                defaultSize={100 / arr.length}
                minSize={25}
              >
                {PaneComponentMap[v] ?? (
                  <div className="p-4 text-muted-foreground">
                    Unknown pane: {v}
                  </div>
                )}
              </Panel>

              {splitScreenEnabled && index < arr.length - 1 && (
                <PanelResizeHandle
                  className="w-3 bg-blue-100 hover:bg-blue-400
                   dark:bg-blue-700 dark:hover:bg-blue-600
                   transition-colors duration-200
                   cursor-col-resize rounded-sm"
                />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    </div>
  );
}
