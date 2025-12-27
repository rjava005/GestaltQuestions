import { MyButton } from "../../components/Base/Button";
import { DropDown } from "../../components/Generic/DropDown";
import {
    QuestionOptionsToolBar,
} from "./QuestionToolBarItems";
import { useState } from "react";

type QuestionBuilderMode = "Editing" | "Preview";
const EditorOptions: QuestionBuilderMode[] = ["Editing", "Preview"];

type QuestionBuilderProps = {
    title: string;
};

export default function QuestionBuilderHeader({ title }: QuestionBuilderProps) {
    const [questionMode, setQuestionMode] =
        useState<QuestionBuilderMode>("Editing");

    return (
        <div className="flex flex-col w-full gap-4">
            <div>
                <div className="w-1/4">
                    <DropDown
                        options={EditorOptions}
                        label=""
                        selected={questionMode}
                        setSelected={(val) => setQuestionMode(val as QuestionBuilderMode)}
                    />
                </div>
            </div>
            <div className="flex flex-row items-center gap-4">
                <h1 className="text-3xl font-bold">{title}</h1>
                {QuestionOptionsToolBar.map((v) => (
                    <MyButton
                        icon={v.icon}
                        className={v.color}
                        name={v.label}
                        key={v.key}
                    />
                ))}
            </div>
        </div>
    );
}
