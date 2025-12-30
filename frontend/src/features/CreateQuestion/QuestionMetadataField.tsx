import { QuestionAPI } from "../../services";
import type { QuestionData } from "../../types/questionTypes";
import { InputTextForm, BooleanField } from "../../components/FormInputs";
import { useState } from "react";

export default function QuestionMeta() {
    const [title, setTitle] = useState("");
    const [topics, setTopics] = useState<string[]>([]);
    const [questionType, setQuestionType] = useState<string[]>([]);
    const [isAdaptive, setIsAdaptive] = useState(false);
    const [aiGenerated, setAIGenerated] = useState(false);

    const handleCommaSeparation = (val: string) =>
        val
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);

    return (
        <section className="w-full h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-900">
                    Question Metadata
                </h2>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4">
                {/* Title */}
                <InputTextForm
                    label="Question Title"
                    value={title}
                    type="text"
                    id="question-title"
                    onChange={(e) => setTitle(e.target.value)}
                    variant="createQuestion"
                />

                {/* Topics + Types */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <InputTextForm
                        id="topics"
                        value={topics.join(", ")}
                        type="text"
                        label="Topics"
                        hint="Comma separated (e.g. dynamics, kinematics)"
                        variant="createQuestion"
                        onChange={(e) => setTopics(handleCommaSeparation(e.target.value))}
                    />

                    <InputTextForm
                        id="question-type"
                        value={questionType.join(", ")}
                        type="text"
                        label="Question Types"
                        hint="e.g. conceptual, numerical, coding"
                        variant="createQuestion"
                        onChange={(e) =>
                            setQuestionType(handleCommaSeparation(e.target.value))
                        }
                    />
                </div>

                {/* Toggles */}
                <div className="mt-2 flex flex-row gap-2">
                    <BooleanField
                        label="Adaptive Question"
                        value={isAdaptive}
                        onChange={setIsAdaptive}
                    />

                    <BooleanField
                        label="AI Generated"
                        value={aiGenerated}
                        onChange={setAIGenerated}
                    />
                </div>
            </div>
        </section>
    );
}
