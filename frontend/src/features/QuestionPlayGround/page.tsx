import SectionContainer from "../../components/Base/SectionContainer";
import { useState } from "react";
import { DropDown, DropDownAdvance, type DropDownAdvanceOption } from "../../components/Generic/DropDown";
import { TbMatrix } from "react-icons/tb";
const ValidQuestionComponents = [
    "pl-question-panel",
    "pl-number-input",
    "pl-figure",
    "pl-solution-panel",
    "pl-hint",
    "pl-multiple-choice",
    "pl-checkbox",
];

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
    const [selectedOption, setSelectedOption] = useState<string>("");
    const formattedOptions: DropDownAdvanceOption[] = ValidQuestionComponents.map((v) => { return { value: v, label: v, icon: TbMatrix } })
    console.log("Formatted", formattedOptions)
    return (
        <SectionContainer id="question-playground" className="flex flex-col items-center">
            <Header />
            <div className="w-1/2">
                <DropDownAdvance
                    options={formattedOptions}
                    selected={selectedOption}
                    setSelected={setSelectedOption}
                    label="Question Component"
                />
            </div>
        </SectionContainer>
    );
}
