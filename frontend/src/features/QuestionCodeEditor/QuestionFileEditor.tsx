import type React from "react";
import { useCallback, useState } from "react";

import { CodeEditor } from "../../components/CodeEditor";
import { useQuestionFileData } from "../QuestionBuilder";
import { useQuestionInstance } from "../QuestionEngine/instance";
import FileDropDown from "./components/FileDropDown";
import QuestionFileToolBar from "./components/QuestionFileToolBar";
import {
  useActiveFilePreview,
  useActiveQuestionFile,
  useEditableQuestionFiles,
} from "./hooks/hooks";
import { toEditorLanguage } from "./utils";

type QuestionFileEditorBaseProps = {
  qid: string;
};

type QuestionLogsPanelProps = {
  logs?: string[];
};

function QuestionLogsPanel({ logs = [] }: QuestionLogsPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-strong px-3 py-2">
        <h3 className="text-sm font-semibold text-text">Output Logs</h3>
        <span className="text-xs text-text-soft">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto bg-code p-3 font-mono text-xs leading-5 text-text">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div
              key={index}
              className="whitespace-pre-wrap border-b border-border py-1 last:border-b-0"
            >
              {log}
            </div>
          ))
        ) : (
          <div className="text-text-soft">No logs available</div>
        )}
      </div>
    </section>
  );
}

function QuestionFileEditorBase({ qid }: QuestionFileEditorBaseProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const logs = useQuestionInstance((s) => s.logs);
  const refreshQuestions = useQuestionInstance((s) => s.setRefreshKey);
  const refreshFiles = useCallback(() => {
    setRefreshKey((key) => key + 1);
    refreshQuestions();
  }, []);
  const { fileData } = useQuestionFileData(qid, refreshKey);

  const { files, setFiles, updateFileContent } =
    useEditableQuestionFiles(fileData);
  const { activeFile, setActiveFile, loading } = useActiveQuestionFile(files);
  const preview = useActiveFilePreview(activeFile);

  if (loading) return <div>Loading</div>;

  if (!activeFile) return <div>No active file</div>;

  let editorContent: React.ReactNode;

  // Handles the conversion if uploading pngs, pdfs etc

  if (preview.type === "image") {
    editorContent = (
      <img
        src={preview.url}
        alt={activeFile.filename}
        className="max-h-[70vh] w-full object-contain"
      />
    );
  } else if (preview.type === "pdf") {
    editorContent = (
      <iframe
        title={activeFile.filename}
        src={preview.url}
        className="h-[70vh] w-full"
      />
    );
  } else {
    editorContent = (
      <CodeEditor
        value={activeFile.content}
        setValue={(content) => updateFileContent(activeFile.filename, content)}
        language={toEditorLanguage(activeFile.filename)}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-lg border border-border bg-surface-strong p-3 text-text shadow-soft transition-colors">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <FileDropDown
          files={files}
          activeFile={activeFile}
          setActive={setActiveFile}
        />
      </div>

      <QuestionFileToolBar
        qid={qid}
        files={files}
        activeFile={activeFile}
        setFiles={setFiles}
        setActiveFile={setActiveFile}
        onRefresh={refreshFiles}
      />

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border-strong bg-code">
        {editorContent}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="self-start rounded-md border border-border bg-button-secondary px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-muted"
          onClick={() => setShowLogs((visible) => !visible)}
        >
          {showLogs ? "Hide Logs" : "Show Logs"}
        </button>
        {showLogs && <QuestionLogsPanel logs={logs} />}
      </div>
    </div>
  );
}

type QuestionFileEditorProps = {
  qid: string;
};

export default function QuestionFileEditor({ qid }: QuestionFileEditorProps) {
  return <QuestionFileEditorBase qid={qid} />;
}
