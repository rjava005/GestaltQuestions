import type { OnChange } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import { debounce } from "lodash";
import type { editor as MonacoEditor } from "monaco-editor";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";

import CodeEditorToolBar from "./CodeEditorToolBar";
import type { EditorThemeKey } from "./types";
import { languageMap } from "./types";
import { editorThemeOptions } from "./types";
interface CodeEditorProps {
  value: string;
  setValue: (val: string) => void;
  language: string;
  theme?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  theme,
  language = "html",
  value = "",
  setValue,
}) => {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const initialTheme = useMemo<EditorThemeKey>(() => {
    if (theme === "vs" || theme === "vs-light") return "light";
    if (theme === "hc-black") return "highContrast";

    const appTheme = document
      .querySelector("[data-theme]")
      ?.getAttribute("data-theme");

    return appTheme === "light" ? "light" : "dark";
  }, [theme]);

  const [editorThemeKey, setEditorThemeKey] =
    useState<EditorThemeKey>(initialTheme);

  const monacoTheme = editorThemeOptions[editorThemeKey];
  const resolvedLanguage = languageMap[language?.toLowerCase()] ?? "plaintext";

  const handleEditorChange: OnChange = useCallback(
    debounce((v?: string) => setValue(v ?? ""), 350),
    [setValue],
  );

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-surface">
      <CodeEditorToolBar
        language={resolvedLanguage}
        theme={editorThemeKey}
        setEditorTheme={setEditorThemeKey}
      />

      <Editor
        height="70vh"
        language={resolvedLanguage}
        value={value}
        onChange={handleEditorChange}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          formatOnType: true,
          formatOnPaste: true,
          wordWrap: "on",
          bracketPairColorization: { enabled: true },
        }}
        theme={monacoTheme}
      />
    </div>
  );
};

export default memo(CodeEditor);
