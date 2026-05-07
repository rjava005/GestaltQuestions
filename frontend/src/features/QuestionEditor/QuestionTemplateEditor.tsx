import { useEffect, useMemo, useState } from "react";
import { CodeEditor } from "../../components/CodeEditor";
import { DropDown } from "../../components/DropDown";
import { useQuestionCreate, type Filenames } from "../CreateNewQuestion/instance";
import { TemplateFiles } from "../CreateNewQuestion/constants/templateFiles";

type QuestionTemplateEditorProps = {
  mode: "blank" | "template";
};

const toEditorLanguage = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "txt";
  const languageMap: Record<string, string> = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    json: "json",
    html: "html",
    md: "markdown",
  };
  return languageMap[ext] ?? "plaintext";
};

const getDefaultTemplateContent = (
  filename: Filenames,
  isAdaptive: boolean,
  mode: "blank" | "template",
) => {
  if (mode === "blank") return "";

  const spec = TemplateFiles.find((f) => f.filename === filename);
  if (!spec) return "";

  const adaptiveMatch = spec.template.find((t) => t.adaptive === isAdaptive);
  return adaptiveMatch?.template ?? spec.template[0]?.template ?? "";
};

export default function QuestionTemplateEditor({ mode }: QuestionTemplateEditorProps) {
  const defaultFiles = useQuestionCreate((s) => s.defaultFiles);
  const questionIsAdaptive = useQuestionCreate((s) => s.questionIsAdaptive);
  const fileDrafts = useQuestionCreate((s) => s.fileDrafts);
  const setFileDraft = useQuestionCreate((s) => s.setFileDraft);
  const [selectedFile, setSelectedFile] = useState<Filenames | "">("");

  const editorFiles = useMemo<Filenames[]>(() => {
    if (mode === "template") {
      return TemplateFiles.map((f) => f.filename);
    }
    return defaultFiles;
  }, [mode, defaultFiles]);

  useEffect(() => {
    if (!editorFiles.length) {
      setSelectedFile("");
      return;
    }

    if (!selectedFile || !editorFiles.includes(selectedFile as Filenames)) {
      setSelectedFile(editorFiles[0]);
    }
  }, [editorFiles, selectedFile]);

  const activeFile = selectedFile as Filenames | "";
  const language = activeFile ? toEditorLanguage(activeFile) : "plaintext";

  if (!editorFiles.length || !activeFile) {
    return (
      <section className="rounded-2xl border border-border bg-surface-strong/80 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-text">Question File Editor</h2>
        <p className="mt-2 text-sm text-text-muted">
          Select files in the Question Files section to edit them here.
        </p>
      </section>
    );
  }

  const currentValue =
    fileDrafts[activeFile] ??
    getDefaultTemplateContent(activeFile, questionIsAdaptive, mode);

  return (
    <section className="rounded-2xl border border-border bg-surface-strong/80 p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-text">Question File Editor</h2>
        <p className="text-sm text-text-muted">
          View and edit file contents that will be used when creating this question.
        </p>
      </div>

      <div className="mb-3 max-w-sm">
        <DropDown
          label="Editable Files"
          options={editorFiles}
          selected={activeFile}
          setSelected={(next) => setSelectedFile(next as Filenames)}
        />
      </div>

      <CodeEditor
        value={currentValue}
        setValue={(val) => setFileDraft(activeFile, val)}
        language={language}
      />
    </section>
  );
}
