import { InputTextForm, BooleanField } from "../../components/FormInputs";
import { useEffect, useState } from "react";
import { useCreateMode } from "./context";

export default function QuestionMeta() {
    const {
        questionData,
        setQuestionData,
        setIsAdaptive: setAdaptiveFlag,
    } = useCreateMode();

    /* -----------------------------
     Helpers
    ------------------------------ */
    const handleCommaSeparation = (val: string) =>
        val
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);

    /* -----------------------------
     UI-only local state
    ------------------------------ */
    const [topicsInput, setTopicsInput] = useState(
        (questionData.topics ?? []).join(", ")
    );

    const [qtypesInput, setQtypesInput] = useState(
        (questionData.qtypes ?? []).join(", ")
    );

    /* -----------------------------
     Sync parsed arrays → context
    ------------------------------ */
    useEffect(() => {
        setQuestionData((prev) => ({
            ...prev,
            topics: handleCommaSeparation(topicsInput),
        }));
    }, [topicsInput, setQuestionData]);

    useEffect(() => {
        setQuestionData((prev) => ({
            ...prev,
            qtypes: handleCommaSeparation(qtypesInput),
        }));
    }, [qtypesInput, setQuestionData]);

    /* -----------------------------
     Render
    ------------------------------ */
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
                    value={questionData.title ?? ""}
                    type="text"
                    id="question-title"
                    variant="createQuestion"
                    onChange={(e) =>
                        setQuestionData((prev) => ({
                            ...prev,
                            title: e.target.value,
                        }))
                    }
                />

                {/* Topics + Question Types */}
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
                        value={qtypesInput}
                        type="text"
                        label="Question Types"
                        hint="e.g. conceptual, numerical, coding"
                        variant="createQuestion"
                        onChange={(e) => setQtypesInput(e.target.value)}
                    />
                </div>

                {/* Toggles */}
                <div className="mt-2 flex flex-row gap-4">
                    <BooleanField
                        label="Adaptive Question"
                        value={questionData.isAdaptive ?? false}
                        onChange={(value) => {
                            setAdaptiveFlag(value);
                            setQuestionData((prev) => ({
                                ...prev,
                                isAdaptive: value,
                            }));
                        }}
                    />

                    <BooleanField
                        label="AI Generated"
                        value={questionData.ai_generated ?? false}
                        onChange={(value) =>
                            setQuestionData((prev) => ({
                                ...prev,
                                ai_generated: value,
                            }))
                        }
                    />
                </div>
            </div>
        </section>
    );
}
