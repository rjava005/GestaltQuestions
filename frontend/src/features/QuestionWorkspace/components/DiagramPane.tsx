import { useEffect, useMemo, useState } from "react";

import BlockDiagramEditor from "../../GuidedCreator/BlockDiagramEditor";
import type { ParameterDefinition } from "../../GuidedCreator/types";
import { useQuestionFileData, useSaveFile } from "../../QuestionBuilder";
import { useQuestionInstance } from "../../QuestionEngine/instance";
import {
  type BlockDiagramDefinition,
  validateBlockDiagramDefinition,
} from "../../QuestionEngine/render/components/visuals/blockDiagramDefinition";

const DIAGRAM_FILENAME = "block-diagram.json";

/**
 * Parameter options for the binding dropdown, taken from the params the current
 * adaptive run actually produced. Only the name is meaningful here -- the range
 * fields exist to satisfy the guided creator's shared type.
 */
function parametersFromRun(params: Record<string, unknown>) {
  return Object.keys(params).map<ParameterDefinition>((name) => ({
    id: name,
    name,
    type: "decimal",
    minimum: "",
    maximum: "",
    unit: "",
    decimalPlaces: 3,
  }));
}

export default function DiagramPane({ qid }: { qid: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { fileData, loading, error } = useQuestionFileData(qid, refreshKey);
  const { saveFile, loading: saving, error: saveError } = useSaveFile();
  const runParams = useQuestionInstance(
    (state) => state.quiz_data?.params ?? {},
  );

  const [definition, setDefinition] = useState<BlockDiagramDefinition | null>(
    null,
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const source = fileData.find((file) => file.filename === DIAGRAM_FILENAME);

  useEffect(() => {
    if (!source) {
      setDefinition(null);
      setParseError(null);
      return;
    }
    try {
      setDefinition(validateBlockDiagramDefinition(JSON.parse(source.content)));
      setParseError(null);
    } catch (err) {
      setDefinition(null);
      setParseError(err instanceof Error ? err.message : String(err));
    }
    setDirty(false);
  }, [source]);

  const parameters = useMemo(
    () => parametersFromRun(runParams as Record<string, unknown>),
    [runParams],
  );

  if (loading && !fileData.length)
    return (
      <p className="p-4 text-sm text-text-muted">Loading question files…</p>
    );

  if (error)
    return (
      <p role="alert" className="p-4 text-sm text-danger">
        {error}
      </p>
    );

  if (!source)
    return (
      <div className="p-4 text-sm text-text-muted">
        <p className="font-semibold text-text">
          No block diagram in this question
        </p>
        <p className="mt-1">
          Add a <code>{DIAGRAM_FILENAME}</code> file and a{" "}
          <code>&lt;pl-block-diagram&gt;</code> tag in the Editor pane, then
          reopen this pane to author it visually.
        </p>
      </div>
    );

  if (parseError)
    return (
      <div className="p-4 text-sm">
        <p role="alert" className="text-danger">
          {DIAGRAM_FILENAME} could not be parsed: {parseError}
        </p>
        <p className="mt-1 text-text-muted">
          Fix it in the Editor pane — this pane will not overwrite a file it
          cannot read.
        </p>
      </div>
    );

  if (!definition) return null;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          {DIAGRAM_FILENAME}
        </span>
        <div className="flex items-center gap-3">
          {dirty ? (
            <span className="text-xs text-text-muted">Unsaved changes</span>
          ) : savedAt ? (
            <span className="text-xs text-text-muted">Saved {savedAt}</span>
          ) : null}
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={async () => {
              await saveFile(
                qid,
                DIAGRAM_FILENAME,
                JSON.stringify(definition, null, 2),
              );
              setDirty(false);
              setSavedAt(new Date().toLocaleTimeString());
              setRefreshKey((key) => key + 1);
            }}
            className="rounded-md border border-accent bg-surface-strong px-3 py-1.5 text-sm font-semibold text-accent disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save diagram"}
          </button>
        </div>
      </div>

      {saveError ? (
        <p role="alert" className="text-sm text-danger">
          {saveError}
        </p>
      ) : null}

      <BlockDiagramEditor
        definition={definition}
        parameters={parameters}
        onChange={(next) => {
          setDefinition(next);
          setDirty(true);
        }}
      />
    </div>
  );
}
