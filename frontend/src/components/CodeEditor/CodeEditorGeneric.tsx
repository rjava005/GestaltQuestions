import React, { memo, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";


const languageMap: Record<string, string> = {
    js: "javascript",
    py: "python",
    json: "json",
    html: "html",
};

interface CodeEditorProps {
    value: string,
    language: string
    theme?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ theme = "vs-light", language = "html", value = "" }) => {
    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    return (
        <Editor
            height="80vh"
            language={language}
            value={value}
            // onChange={handleEditorChange}
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
