import type { OnChange } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import clsx from "clsx";
import { debounce } from "lodash";
import type { editor as MonacoEditor } from "monaco-editor";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";

const languageMap: Record<string, string> = {
  py: "python",
  python: "python",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  json: "json",
  html: "html",
  md: "markdown",
  markdown: "markdown",
};

const editorThemeOptions = {
  light: "vs",
  dark: "vs-dark",
  highContrast: "hc-black",
} as const;

type EditorThemeKey = keyof typeof editorThemeOptions;

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-strong px-3 py-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Editor: {resolvedLanguage}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="editor-theme-toggle"
            className="text-xs font-medium text-text-muted"
          >
            Theme
          </label>
          <select
            id="editor-theme-toggle"
            value={editorThemeKey}
            onChange={(e) =>
              setEditorThemeKey(e.target.value as EditorThemeKey)
            }
            className={clsx(
              "rounded-md border border-border",
              "bg-surface-strong px-2 py-1 text-xs",
              "text-text",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            )}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="highContrast">High Contrast</option>
          </select>
        </div>
      </div>

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
