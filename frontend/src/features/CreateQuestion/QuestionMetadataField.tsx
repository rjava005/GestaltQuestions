import { InputTextForm, BooleanField } from "../../components/FormInputs";
import { useEffect, useState } from "react";
import { useCreateMode } from "./context";

export default function QuestionMeta() {
    const [title, setTitle] = useState("");

    // Handle raw values
    const [topicsInput, setTopicsInput] = useState<string>("");
    const [topics, setTopics] = useState<string[]>([]);
    const [questionTypeInput, setQuestionTypeInput] = useState("");
    const [questionType, setQuestionType] = useState<string[]>([]);
    // boolean
    const [isAdaptive, setIsAdaptive] = useState(false);
    const [aiGenerated, setAIGenerated] = useState(false);

    const { setIsAdaptive: setAdaptiveFlag } = useCreateMode()

    const handleCommaSeparation = (val: string) =>
        val
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);

    useEffect(() => {
        setTopics(handleCommaSeparation(topicsInput))
    }, [topicsInput, setTopicsInput])

    useEffect(() => {
        setQuestionType(handleCommaSeparation(questionTypeInput))
    }, [questionTypeInput, setQuestionTypeInput])

    console.log(topics, questionType)
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
                        value={topicsInput}
                        type="text"
                        label="Topics"
                        hint="Comma separated (e.g. dynamics, kinematics)"
                        variant="createQuestion"
                        onChange={(e) => setTopicsInput(e.target.value)}
                    />

                    <InputTextForm
                        id="question-type"
                        value={questionTypeInput}
                        type="text"
                        label="Question Types"
                        hint="e.g. conceptual, numerical, coding"
                        variant="createQuestion"
                        onChange={(e) =>
                            setQuestionTypeInput(e.target.value)
                        }
                    />
                </div>

                {/* Toggles */}
                <div className="mt-2 flex flex-row gap-2">
                    <BooleanField
                        label="Adaptive Question"
                        value={isAdaptive}
                        onChange={(value) => { setIsAdaptive(value); setAdaptiveFlag(value); }}
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
