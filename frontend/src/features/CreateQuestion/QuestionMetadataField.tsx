import { QuestionAPI } from "../../services";
import type { QuestionData } from "../../types/questionTypes";
import { InputTextForm } from "../../components/FormInputs/InputComponents";

import { useState } from "react";
export default function QuestionMeta() {
    const [title, setTitle] = useState<string>("");
    const [topics, setTopics] = useState<string[]>([]);
    const [questionType, setQuestionType] = useState<string[]>([]);
    const [isAdaptive, setIsAdaptive] = useState<boolean>(false);
    const [aiGenerate, isAIGenerated] = useState<boolean>(false);

    const handleCommaSeperation = (val: string) => val.split(",");
    return (
        <div className="w-full my-2">
            <h1 className="text-lg">Metadata</h1>
            <div className="flex flex-col gap-y-2">
                <InputTextForm
                    label="Question Title"
                    value={title}
                    type="text"
                    id="question-title"
                    onChange={(e) => setTitle(e.target.value)}
                    variant="inline"
                />

                <div className="flex fle-row items-center justify-between gap-x-4">
                    <InputTextForm
                        id="topics"
                        value={topics}
                        type="text"
                        label="Topics (comma separated)"
                        variant="inline"
                        onChange={(e) => {
                            return setTopics(handleCommaSeperation(e.target.value));
                        }}
                    />
                    <InputTextForm
                        id="Question Type"
                        value={questionType}
                        type="text"
                        label="Question Types (comma separated)"
                        variant="inline"
                        onChange={(e) => {
                            return setQuestionType(handleCommaSeperation(e.target.value));
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
