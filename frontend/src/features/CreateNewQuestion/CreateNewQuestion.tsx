import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "react-toastify";

import { Button } from "../../components/Button";
import { useCreateQuestion } from "../QuestionBuilder";
import { QuestionTemplateEditor } from "../QuestionEditor";
import QuestionFilesDisplay from "./components/QuestionFilesView";
import QuestionForm from "./components/QuestionForm";
import { TemplateFiles, TemplateModePresets } from "./constants/templateFiles";
import { type Filenames, useQuestionCreate } from "./instance";

type CreateMode = "blank" | "template";

const getTemplateContent = (
  filename: Filenames,
  isAdaptive: boolean,
  mode: CreateMode,
  fileDrafts: Partial<Record<Filenames, string>>,
) => {
  if (fileDrafts[filename] !== undefined) {
    return fileDrafts[filename] ?? "";
  }

  if (mode === "blank") return "";

  const templateSpec = TemplateFiles.find((f) => f.filename === filename);
  if (!templateSpec) return "";

  const adaptiveMatch = templateSpec.template.find(
    (t) => t.adaptive === isAdaptive,
  );
  return adaptiveMatch?.template ?? templateSpec.template[0]?.template ?? "";
};

export default function CreateQuestionFromBlank() {
  const qdata = useQuestionCreate((s) => s.questionData);
  const defaultFiles = useQuestionCreate((s) => s.defaultFiles);
  const uploadedFiles = useQuestionCreate((s) => s.uploadedFiles);
  const questionIsAdaptive = useQuestionCreate((s) => s.questionIsAdaptive);
  const fileDrafts = useQuestionCreate((s) => s.fileDrafts);
  const setQdata = useQuestionCreate((s) => s.setQuestionData);
  const setDefaultFiles = useQuestionCreate((s) => s.setDefaultFiles);
  const { createQuestion } = useCreateQuestion();
  const [mode, setMode] = useState<CreateMode>("blank");
  const [showTemplateEditor, setShowTemplateEditor] = useState(
    mode === "template",
  );

  // Set default files and qdata
  useEffect(() => {
    if (mode !== "template") return;

    const preset = questionIsAdaptive
      ? TemplateModePresets.adaptive
      : TemplateModePresets.nonAdaptive;

    setDefaultFiles(preset.defaultFiles);
    setQdata({
      ...preset.questionData,
      title: qdata?.title ? preset.questionData?.title : "",
      ai_generated: qdata?.ai_generated ?? false,
    });
  }, [
    mode,
    questionIsAdaptive,
    setDefaultFiles,
    setQdata,
    qdata?.title,
    qdata?.ai_generated,
  ]);

  useEffect(() => {
    if (mode === "blank") {
      setShowTemplateEditor(false);
    } else {
      setShowTemplateEditor(true);
    }
  }, [mode]);

  const handleSubmit = async () => {
    if (!qdata?.title) {
      toast.error("Question title is required.");
      return;
    }

    try {
      const selectedTemplateFiles =
        mode === "template"
          ? TemplateFiles.map((t) => t.filename)
          : defaultFiles;

      const dFiles = selectedTemplateFiles.map((filename) => {
        const content = getTemplateContent(
          filename,
          questionIsAdaptive,
          mode,
          fileDrafts,
        );

        return new File([content], filename, {
          type: "text/plain",
        });
      });

      const totalFiles = [...dFiles, ...(uploadedFiles ?? [])];

      await createQuestion(qdata, totalFiles);
      toast.success("Question created successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create question.",
      );
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-2 p-2">
      <div className="flex gap-2">
        <Button
          name="Blank"
          onClick={() => setMode("blank")}
          className={mode === "blank" ? "opacity-100" : "opacity-70"}
        />
        <Button
          name="Template"
          onClick={() => setMode("template")}
          className={mode === "template" ? "opacity-100" : "opacity-70"}
        />
        <Button
          name={
            showTemplateEditor ? "Hide Template Editor" : "Show Template Editor"
          }
          onClick={() => setShowTemplateEditor((prev) => !prev)}
          className="opacity-80"
        />
      </div>

      <PanelGroup
        direction="horizontal"
        className="min-h-0 flex-1 items-stretch"
      >
        <Panel defaultSize={showTemplateEditor ? 34 : 50} minSize={25}>
          <div className="h-full overflow-auto">
            <QuestionForm value={qdata} onChange={setQdata} />
          </div>
        </Panel>

        <PanelResizeHandle className="mx-1 w-px bg-border/70" />

        <Panel defaultSize={showTemplateEditor ? 33 : 50} minSize={25}>
          <QuestionFilesDisplay />
        </Panel>

        {showTemplateEditor && (
          <>
            <PanelResizeHandle className="mx-1 w-px bg-border/70" />
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full overflow-auto">
                <QuestionTemplateEditor mode={mode} />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>

      <Button name="Create" onClick={handleSubmit} />
    </div>
  );
}
