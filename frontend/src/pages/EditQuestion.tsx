// src/pages/QuestionsWorkspacePage.tsx
import React from "react";
import { useState } from "react";
import { useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useParams } from "react-router-dom";

import { Button } from "../components/Button";
import type { ServerSettings } from "../features/QuestionBuilder/components/ServerToggle";
import { ServerModeSwitch } from "../features/QuestionBuilder/components/ServerToggle";
import { useQuestionFileData } from "../features/QuestionBuilder/hooks";
import EditorPane from "../features/QuestionBuilder/sections/EditorPane";
import QuestionMetaDataPreview from "../features/QuestionConfig/QuestionMetadataPreview";
import { QuestionRender } from "../features/QuestionEngine";
import type { FileData } from "../types/fileTypes";

type EditorOptions = "LivePreview" | "Edit" | "Metadata";

type PaneContext = {
  qid: string;
  fileData: FileData[];
  type: "question.html" | "solution.html";
  serverMode: ServerSettings;
};

const paneRenderMap: Record<
  EditorOptions,
  (ctx: PaneContext) => React.ReactNode
> = {
  LivePreview: ({ qid, serverMode }) => (
    <QuestionRender qid={qid} serverSettings={serverMode} />
  ),
  Edit: ({ qid, fileData }) => <EditorPane qid={qid} fileData={fileData} />,
  Metadata: ({ qid }) => <QuestionMetaDataPreview qid={qid} />,
};

export default function EditQuestionPage() {
  const [activePanes, setActivePanes] = useState<EditorOptions[]>([
    "LivePreview",
  ]);
  const [splitScreenEnabled, setSplitScreenEnabled] = useState<boolean>(true);
  const [serverMode, setServerMode] = useState<ServerSettings>("javascript");
  // Question Data
  const { qid } = useParams<{ qid: string }>();
  const { fileData, loading } = useQuestionFileData(qid ?? "");
  // Pane Logic
  const panesToRender = splitScreenEnabled
    ? activePanes
    : activePanes.length
      ? [activePanes[0]]
      : ["LivePreview"];

  const allPanes: EditorOptions[] = ["LivePreview", "Edit", "Metadata"];
  const paneLabels: Record<EditorOptions, string> = {
    LivePreview: "Live Preview",
    Edit: "Editor",
    Metadata: "Metadata",
  };

  const togglePane = (pane: EditorOptions) => {
    setActivePanes((prev) => {
      const exists = prev.includes(pane);
      if (exists) {
        const next = prev.filter((p) => p !== pane);
        return next.length ? next : ["LivePreview"];
      }
      return [...prev, pane];
    });
  };

  const showSinglePane = (pane: EditorOptions) => {
    setSplitScreenEnabled(false);
    setActivePanes([pane]);
  };

  const ctx: PaneContext = {
    qid: qid ?? "",
    fileData: fileData,
    type: "question.html",
    serverMode,
  };

  // Handle server change
  const handleServerModeChange = useCallback((next: ServerSettings) => {
    setServerMode(next);
  }, []);

  if (!qid) return <div className="text-text-muted">Missing question id.</div>;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Workspace View
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            name="Single"
            onClick={() => setSplitScreenEnabled(false)}
            color={splitScreenEnabled ? "paneMuted" : "paneActive"}
            size="sm"
          />
          <Button
            name="Split"
            onClick={() => setSplitScreenEnabled(true)}
            color={splitScreenEnabled ? "paneActive" : "paneMuted"}
            size="sm"
          />
        </div>

        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Runtime Mode
        </div>
        <div className="mb-3">
          <ServerModeSwitch
            value={serverMode}
            onChange={handleServerModeChange}
          />
        </div>

        {!splitScreenEnabled ? (
          <div>
            <div className="mb-2 text-sm text-text-muted">
              Choose one pane to focus on:
            </div>
            <div className="flex flex-wrap gap-2">
              {allPanes.map((pane) => (
                <Button
                  key={`single-${pane}`}
                  name={paneLabels[pane]}
                  onClick={() => showSinglePane(pane)}
                  color={activePanes[0] === pane ? "paneActive" : "paneMuted"}
                  size="sm"
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 text-sm text-text-muted">
              Toggle panes to show in split view:
            </div>
            <div className="flex flex-wrap gap-2">
              {allPanes.map((pane) => {
                const isActive = activePanes.includes(pane);
                return (
                  <Button
                    key={`toggle-${pane}`}
                    name={`${isActive ? "Visible" : "Hidden"}: ${paneLabels[pane]}`}
                    onClick={() => togglePane(pane)}
                    color={isActive ? "paneActive" : "paneMuted"}
                    size="sm"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
      {loading && (
        <div className="text-sm text-text-muted">Loading files...</div>
      )}

      <PanelGroup direction="horizontal">
        {panesToRender.map((v, index, arr) => (
          <React.Fragment key={`${v}-${index}`}>
            <Panel
              order={index + 1}
              defaultSize={100 / arr.length}
              minSize={25}
              className="gap-2"
            >
              {paneRenderMap[v as EditorOptions]?.(ctx) ?? (
                <div className="p-4 text-muted-foreground">
                  Unknown pane: {v}
                </div>
              )}
            </Panel>

            {splitScreenEnabled && index < arr.length - 1 && (
              <PanelResizeHandle className="w-3 bg-blue-100 hover:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 cursor-col-resize rounded-sm" />
            )}
          </React.Fragment>
        ))}
      </PanelGroup>
    </div>
  );
}
