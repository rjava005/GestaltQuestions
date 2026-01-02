import { Button } from "../../components/Button";
import { DropDown } from "../../components/Generic/DropDown";
import { QuestionOptionsToolBar } from "./QuestionToolBarItems";
import { useState } from "react";
import clsx from "clsx";
import { FiMoreHorizontal } from "react-icons/fi";

type QuestionBuilderMode = "Editing" | "Preview";
const EditorOptions: QuestionBuilderMode[] = ["Editing", "Preview"];

type QuestionBuilderProps = {
  title: string;
};

export default function QuestionBuilderHeader({ title }: QuestionBuilderProps) {
  const [questionMode, setQuestionMode] =
    useState<QuestionBuilderMode>("Editing");
  const [showQuestionOptions, setShowQuestionOptions] =
    useState<boolean>(false);

  return (
    <div className="flex w-full flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
      {/* Top Row: Mode + Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Mode selector */}
        <div className="w-[220px]">
          <DropDown
            options={EditorOptions}
            label=""
            selected={questionMode}
            setSelected={(val) => setQuestionMode(val as QuestionBuilderMode)}
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Toggle options */}
          <Button
            icon={FiMoreHorizontal}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition"
            name={showQuestionOptions ? "Hide Options" : "Show Options"}
            onClick={() => setShowQuestionOptions((prev) => !prev)}
          />
        </div>
      </div>

      {/* Title Row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h1>

        {/* Options Toolbar */}
        {showQuestionOptions && (
          <div className="flex items-center gap-2">
            {QuestionOptionsToolBar.map((v) => (
              <Button
                key={v.key}
                icon={v.icon}
                name={v.label}
                className={clsx(
                  v.color,
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
