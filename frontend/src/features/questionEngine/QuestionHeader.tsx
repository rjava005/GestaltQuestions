import type { QuestionData, QuestionMeta } from "../../types/questionTypes";
import { GenericInfo } from "../../components/Generic/GenericInfo";
import { Pill } from "../../components/Base/Pill";
import { SimpleToggle } from "../../components/Generic/SimpleToggle";
import { useState } from "react";
import { FaPython } from "react-icons/fa";
import { IoLogoJavascript } from "react-icons/io5";
import { useCodeEditorContext } from "../../context/CodeEditorContext";



export default function QuestionInfo({ qmetadata }: { qmetadata: QuestionData | QuestionMeta }) {
  const { topics = [], isAdaptive } = qmetadata;

  return (
    <div className="flex flex-col gap-5 p-2 sm:p-4">
      <GenericInfo title="Topics" data={topics.map((t) => (typeof t === "object" ? t.name : t))} theme="info" />

      <div className="flex items-center gap-4">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Adaptive:
        </p>
        <Pill theme={isAdaptive ? "success" : "danger"}>
          {isAdaptive ? "Adaptive" : "Static"}
        </Pill>
      </div>
    </div>
  );
}

// --- Header with Toggle ---
export function QuestionHeader({ question }: { question: QuestionData | QuestionMeta }) {
  const [showMeta, setShowMeta] = useState(true);
  const { codeRunningSettings } = useCodeEditorContext();

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 mt-8">
      {/* Title Section */}
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 ">
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-center sm:text-left text-gray-800 dark:text-gray-100 tracking-tight">
          <span>{question.title}</span>
          {question.isAdaptive && (
            codeRunningSettings === "javascript" ? (
              <IoLogoJavascript className="text-yellow-500 dark:text-yellow-400" size={28} />
            ) : (
              <FaPython className="text-blue-600 dark:text-blue-400" size={28} />
            )
          )}
        </h1>
      </div>
      <SimpleToggle
        setToggle={() => setShowMeta((prev) => !prev)}
        label="Show Question Metadata"
        id="meta-toggle"
        checked={showMeta}
      />
      {/* Divider */}
      <hr className="border-t border-gray-300 dark:border-gray-700 mx-auto w-2/3 sm:w-1/2" />
      {showMeta && <QuestionInfo qmetadata={question} />}
    </div>
  );
}
