import CodeEditorGeneric from "../../components/CodeEditor/CodeEditor.tsx";
import FileToolBar from "./EditorToolBar";
import { useCodeEditorContext } from "./context";
import { useQuestionFiles } from "./hooks";
import { DropDown } from "../../components/DropDown";
import { resolveLanguage } from "./utils";
import { ServerSettingsToggle, ToggleField } from "../../components/Toggles";
import { useQuestionEngineContext } from "../QuestionEngine";
import { LogOutput } from "../../components/LogOutput.tsx";
import { useEffect, useState } from "react";
import { getImageBase64FileData, isImageExt } from "../../utils/parsers";



export default function QuestionEditor() {
    const {
        fileNames,
        selectedFile,
        setSelectedFile,
        fileContent,
        setFileContent,
        showLogs,
        setShowLogs,
    } = useCodeEditorContext();
    const { filesData } = useQuestionFiles();
    const { serverSetting, setServerSetting } = useQuestionEngineContext();
    const [image, setImage] = useState<string | null>(null);

    // Handle Cases when selected file is an image
    useEffect(() => {
        if (!selectedFile) {
            setImage(null);
            return;
        }
        if (isImageExt(selectedFile)) {
            const file = filesData.find((v) => v.filename === selectedFile);
            if (file) {
                const imageUrl = getImageBase64FileData(file);
                setImage(imageUrl);
            }
        } else {
            setImage(null);
        }
    }, [filesData, selectedFile]);

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            {/* ───────── Top Toolbar ───────── */}
            <div
                className="flex flex-wrap items-center justify-between gap-3
                      bg-slate-100 dark:bg-slate-900
                      border border-slate-200 dark:border-slate-800
                      rounded-lg px-3 py-2"
            >
                {/* Left: File tools */}
                <div className="flex items-center gap-2">
                    <FileToolBar />
                </div>

                {/* Right: Engine + logs */}
                <div className="flex items-center gap-3">
                    <ToggleField
                        id="ToggleLogs"
                        variant="compact"
                        label="Show Logs"
                        checked={showLogs}
                        setToggle={() => setShowLogs((prev) => !prev)}
                    />
                    <ServerSettingsToggle
                        language={serverSetting}
                        setLanguage={setServerSetting}
                    />
                </div>
            </div>

            {/* ───────── File Selector ───────── */}
            <div className="max-w-xs">
                <DropDown
                    selected={selectedFile}
                    setSelected={setSelectedFile}
                    options={fileNames}
                    label="File"
                />
            </div>

            {/* ───────── Code Editor ───────── */}
            <div
                className="flex-1 min-h-0
                      border border-slate-200 dark:border-slate-800
                      rounded-lg overflow-hidden"
            >
                {image ? (
                    <img
                        src={image}
                        alt={selectedFile ?? "decoded image"}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                    />
                ) : (
                    <CodeEditorGeneric
                        value={fileContent}
                        setValue={setFileContent}
                        language={resolveLanguage(selectedFile)}
                    />
                )}
                {showLogs && <LogOutput />}
            </div>
        </div>
    );
}
