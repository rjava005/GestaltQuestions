import SectionContainer from "../../components/Base/SectionContainer";
import { useState } from "react";
import { DropDownAdvance, type DropDownAdvanceOption } from "../../components/Generic/DropDown";

import { ValidQuestionComponents, type QuestionComponentMeta } from "./config";
import CodeEditorGeneric from "../../components/CodeEditor/CodeEditorGeneric";


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

    const [selectedComponent, setSelectedComponent] = useState<QuestionComponentMeta>(ValidQuestionComponents[0])
    const handleSelectComponent = (val: string) => {
        const found = ValidQuestionComponents.find(v => v.name === val);
        if (found) setSelectedComponent(found);
    };

    const formattedOptions: DropDownAdvanceOption[] = ValidQuestionComponents.map((v) => { return { value: v.name, label: v.label, icon: v.icon } })
    return (
        <SectionContainer id="question-playground" className="flex flex-col items-center">
            <Header />
            <div className="w-1/2 my-4">
                <DropDownAdvance
                    options={formattedOptions}
                    selected={selectedComponent?.name}
                    setSelected={handleSelectComponent}
                    label="Question Component"
                />
            </div>

            <div className="border-2 w-full ">
                <CodeEditorGeneric value={selectedComponent.example} language="html" />
            </div>
        </SectionContainer>
    );
}
