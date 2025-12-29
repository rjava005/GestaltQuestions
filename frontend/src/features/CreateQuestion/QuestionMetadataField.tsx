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
    return (
        <div className="w-full my-2">
            <h1 className="text-lg">Metadata</h1>
            <div className="flex flex-col">
                <div>Question Title</div>
                <div>Category</div>
                <div>Tags</div>
                <div>Description</div>
            </div>
        </div>
    );
}
