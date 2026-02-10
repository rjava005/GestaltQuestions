import React, { memo, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import type { OnChange } from "@monaco-editor/react";
import { debounce } from "lodash";
import { useCallback } from "react";

interface CodeEditorProps {
  value: string;
  setValue: (val: string) => void;
  language: string;
  theme?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  theme = "vs-light",
  language = "html",
  value = "",
  setValue,
}) => {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const handleEditorChange: OnChange = useCallback(
    debounce((v?: string) => setValue(v ?? ""), 600),
    [setValue]
  );

  return (
    <Editor
      height="80vh"
      language={language}
      value={value}
      onChange={handleEditorChange}
      onMount={(editor) => {
        console.log("Monaco mounted");
        editorRef.current = editor;
      }}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        smoothScrolling: true,
        formatOnType: true,
        formatOnPaste: true,
        wordWrap: "on",
      }}
      theme={theme}
    />
  );
};

export default memo(CodeEditor);
