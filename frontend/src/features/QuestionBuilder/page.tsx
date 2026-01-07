import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  TbLayoutSidebarRightCollapseFilled,
  TbLayoutSidebarRightExpandFilled,
} from "react-icons/tb";
import { Outlet } from "react-router-dom";
import { Section } from "../../components/Section";
import QuestionBuilderSideBar from "./QuestionBuilderSideBar";

export default function QuestionBuilder() {
  const [showDashboard, setShowDashboard] = useState(true);

  return (
    <Section
      id="question_builder"
      className="min-h-screen bg-slate-50 flex flex-col"
    >
      {/* Top Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDashboard((p) => !p)}
            className="flex items-center justify-center rounded-lg border bg-slate-100 p-2 hover:bg-slate-200 transition"
            title={showDashboard ? "Hide sidebar" : "Show sidebar"}
          >
            {showDashboard ? (
              <TbLayoutSidebarRightCollapseFilled size={22} />
            ) : (
              <TbLayoutSidebarRightExpandFilled size={22} />
            )}
          </button>

          <h1 className="text-lg font-semibold text-slate-800">
            Question Builder
          </h1>
        </div>
      </div>

      {/* Main Layout */}
      <PanelGroup direction="horizontal" className="flex flex-1">
        {/* Sidebar */}
        {showDashboard && (
          <>
            <Panel
              defaultSize={15}
              minSize={15}
              maxSize={22}
              className="bg-white border-r"
            >
              <QuestionBuilderSideBar />
            </Panel>

            <PanelResizeHandle className="group w-[3px] bg-transparent hover:bg-blue-400 transition cursor-col-resize" />
          </>
        )}

        {/* Main Content */}
        <Panel className="bg-slate-50" defaultSize={22} minSize={18}>
          <div className="p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </Panel>
      </PanelGroup>
    </Section>
  );
}
