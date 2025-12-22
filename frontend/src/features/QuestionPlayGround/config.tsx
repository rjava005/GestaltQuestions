
import type { IconType } from "react-icons/lib";
import { LuPanelTop } from "react-icons/lu";
import { TbNumber123 } from "react-icons/tb";
import { FaImage } from "react-icons/fa";
import { FaRegLightbulb } from "react-icons/fa";
import { CiBoxList } from "react-icons/ci";
import { IoIosCheckboxOutline } from "react-icons/io";

export type QuestionComponentMeta = {
    name: string;                 // canonical PL tag
    label: string;                // human-readable
    icon: IconType;        // React icon
    example: string;              // example markup / preview (string for now)
};

export const ValidQuestionComponents: QuestionComponentMeta[] = [
    {
        name: "pl-question-panel",
        label: "Question Panel",
        icon: LuPanelTop,
        example: "<pl-question-panel>Question text here</pl-question-panel>",
    },
    {
        name: "pl-solution-panel",
        label: "Solution Panel",
        icon: LuPanelTop,
        example:
            "<pl-solution-panel>Solution explanation here</pl-solution-panel>",
    },
    {
        name: "pl-figure",
        label: "Figure",
        icon: FaImage,
        example:
            '<pl-figure file-name="diagram.png"></pl-figure>',
    },
    {
        name: "pl-number-input",
        label: "Number Input",
        icon: TbNumber123,
        example:
            '<pl-number-input answers-name="x" label="$x$"></pl-number-input>',
    },


    {
        name: "pl-hint",
        label: "Hint",
        icon: FaRegLightbulb,
        example:
            "<pl-hint>Try writing the equilibrium equations.</pl-hint>",
    },
    {
        name: "pl-multiple-choice",
        label: "Multiple Choice",
        icon: CiBoxList,
        example:
            `<pl-multiple-choice answers-name="q1">
  <pl-answer correct="true">Option A</pl-answer>
  <pl-answer correct="false">Option B</pl-answer>
</pl-multiple-choice>`,
    },
    {
        name: "pl-checkbox",
        label: "Checkbox",
        icon: IoIosCheckboxOutline,
        example:
            `<pl-checkbox answers-name="q2">
  <pl-answer correct="true">Choice A</pl-answer>
  <pl-answer correct="false">Choice B</pl-answer>
</pl-checkbox>`,
    },
];
