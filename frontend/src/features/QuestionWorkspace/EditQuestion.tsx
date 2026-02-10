import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { useCurrentQuestionMeta } from "../QuestionEngine";
import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";

import type { QuestionData } from "../../types/questionTypes";

import { InputTextForm, BooleanField } from "../../components/FormInputs";
import { Button } from "../../components/Button";
import { Section } from "../../components/Section";

import { handleCommaSeperatedValues } from "../../utils";
import { QuestionAPI } from "../../services";



export default function EditQuestion() {
    const { questionMeta, error } = useCurrentQuestionMeta();
    const { selectedQuestionID } = useQuestionCollectionContext();

    const [editMeta, setEditMeta] = useState<QuestionData | null>(questionMeta);

    const [topicsInput, setTopicsInput] = useState(
        (questionMeta?.topics ?? []).join(", ")
    );

    const [qtypesInput, setQtypesInput] = useState(
        (questionMeta?.qtypes ?? []).join(", ")
    );

    /* ----------------------------- Sync Inputs ----------------------------- */

    useEffect(() => {
        setEditMeta((prev) =>
            prev
                ? {
                    ...prev,
                    topics: handleCommaSeperatedValues(topicsInput),
                }
                : prev
        );
    }, [topicsInput]);

    useEffect(() => {
        setEditMeta((prev) =>
            prev
                ? {
                    ...prev,
                    qtypes: handleCommaSeperatedValues(qtypesInput),
                }
                : prev
        );
    }, [qtypesInput]);

    /* ----------------------------- Error State ----------------------------- */

    if (!editMeta) {
        return (
            <div className="text-sm text-red-600">
                Failed to load question metadata.
                {error && <span className="ml-1">{error}</span>}
            </div>
        );
    }

    /* ----------------------------- Handlers ----------------------------- */

    const handleUpdateQuestion = async () => {
        if (!selectedQuestionID) {
            toast.error("No question selected");
            return;
        }

        try {
            await QuestionAPI.updateQuestion(selectedQuestionID, editMeta);
            toast.success("Question updated successfully");
        } catch (err: unknown) {
            console.error("Failed to update question", err);

            const message =
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred";

            toast.error(message);
        }
    };

    /* ----------------------------- Render ----------------------------- */

    return (
        <Section id="edit-question-meta">
            <div className="flex flex-col gap-6 m-2 w-8/10">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Question Metadata
                    </h2>
                    <p className="text-sm text-slate-500">
                        Edit basic information used for organization, filtering, and
                        execution behavior.
                    </p>
                </div>

                {/* Core Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputTextForm
                        label="Question Title"
                        value={editMeta.title ?? ""}
                        type="text"
                        id="question-title"
                        variant="createQuestion"
                        onChange={(e) =>
                            setEditMeta((prev) => ({
                                ...prev!,
                                title: e.target.value,
                            }))
                        }
                    />

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

                {/* Adaptive Section */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h3 className="font-medium text-slate-800">
                                Adaptive Question
                            </h3>
                            <p className="text-sm text-slate-500">
                                Controls whether JavaScript and Python execution is allowed.
                            </p>
                        </div>

                        <BooleanField
                            label=""
                            value={editMeta.isAdaptive ?? false}
                            onChange={(value) =>
                                setEditMeta((prev) => ({
                                    ...prev!,
                                    isAdaptive: value,
                                }))
                            }
                        />
                    </div>

                    {!editMeta.isAdaptive && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                            ⚠️ <strong>Adaptive mode is disabled.</strong>
                            <br />
                            JavaScript and Python code execution will be{" "}
                            <strong>disabled</strong> for this question.
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-2">
                    <Button
                        name="Update the question"
                        onClick={handleUpdateQuestion}
                    />
                </div>
            </div>
        </Section>
    );
}
