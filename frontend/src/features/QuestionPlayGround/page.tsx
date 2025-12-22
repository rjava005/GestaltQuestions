import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import SectionContainer from "../../components/Base/SectionContainer";
import CodeEditorGeneric from "../../components/CodeEditor/CodeEditorGeneric";
import {
    DropDownAdvance,
    type DropDownAdvanceOption,
} from "../../components/Generic/DropDown";

import QuestionHTMLToReact from "../QuestionComponents/ParseQuestionHTML";
import {
    ValidQuestionComponents,
    type QuestionComponentMeta,
} from "./config";



function Header() {
    return (
        <div className="flex flex-col items-center gap-y-4 my-4">
            <h1 className="text-3xl font-bold">Question Component Playground</h1>
            <h2 className="text-xl text-gray-600">
                Test and Explore different question types
            </h2>
        </div>
    );
}

export default function QuestionPlayGroundPage() {
    const [selectedComponent, setSelectedComponent] =
        useState<QuestionComponentMeta>(ValidQuestionComponents[0]);
    const [editorValue, setEditorValue] = useState(
        ValidQuestionComponents[0].example
    );

    useEffect(() => {
        setEditorValue(selectedComponent.example);
    }, [selectedComponent]);

    const handleSelectComponent = (val: string) => {
        const found = ValidQuestionComponents.find((v) => v.name === val);
        if (found) setSelectedComponent(found);
    };

    const formattedOptions: DropDownAdvanceOption[] = ValidQuestionComponents.map(
        (v) => {
            return { value: v.name, label: v.label, icon: v.icon };
        }
    );
    return (
        <SectionContainer
            id="question-playground"
            className="flex flex-col items-center gap-6 py-8"
        >
            <Header />

            {/* Component selector */}
            <div className="w-full max-w-md">
                <DropDownAdvance
                    options={formattedOptions}
                    selected={selectedComponent?.name}
                    setSelected={handleSelectComponent}
                    label="Question Component"
                />
            </div>

            {/* Playground panels */}
            <div className="w-full  h-[500px]">
                <PanelGroup
                    direction="horizontal"
                    className="h-full rounded-lg border border-slate-200 bg-white"
                >
                    {/* Documentation */}
                    <Panel
                        defaultSize={30}
                        minSize={10}
                        className="h-full border-r border-slate-200"
                    >
                        <div className="h-full flex flex-col">
                            <div className="px-3 py-2 text-xs font-medium text-slate-600 border-b">
                                Documentation
                            </div>
                            <div className="flex-1 overflow-hidden">

                            </div>
                        </div>
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-violet-400 transition-colors" />
                    {/* Code editor */}
                    <Panel
                        defaultSize={50}
                        minSize={30}
                        className="h-full border-r border-slate-200"
                    >
                        <div className="h-full flex flex-col">
                            <div className="px-3 py-2 text-xs font-medium text-slate-600 border-b">
                                Component Markup
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <CodeEditorGeneric
                                    value={editorValue}
                                    setValue={setEditorValue}
                                    language="html"

                                />
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-violet-400 transition-colors" />

                    {/* Render preview */}
                    <Panel defaultSize={50} minSize={30} className="h-full">
                        <div className="h-full flex flex-col">
                            <div className="px-3 py-2 text-xs font-medium text-slate-600 border-b">
                                Live Preview
                            </div>
                            <div className="flex-1 p-4 overflow-auto bg-slate-50">
                                <QuestionHTMLToReact html={editorValue} />
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </SectionContainer>

    );
}
