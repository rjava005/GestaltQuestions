import React, { createContext, useState, useContext } from "react";
import type { Filenames, CreateMode } from "./types";
import type { QuestionData } from "../../types/questionTypes";


type CreateQuestionContextType = {
    mode: CreateMode;
    setMode: React.Dispatch<React.SetStateAction<CreateMode>>;
    files: Filenames[];
    setFiles: React.Dispatch<React.SetStateAction<Filenames[]>>;

    questionData: QuestionData;
    setQuestionData: React.Dispatch<React.SetStateAction<QuestionData>>;
    isAdaptive: boolean;
    setIsAdaptive: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CreateQuestionContext =
    createContext<CreateQuestionContextType | null>(null);

const CreateQuestionProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [mode, setMode] = useState<CreateMode>("blank");
    // By default always include this file
    const [files, setFiles] = useState<Filenames[]>(["question.html"]);
    const [isAdaptive, setIsAdaptive] = useState<boolean>(false); // When users says question is adaptive in the field this flag is set
    const [questionData, setQuestionData] = useState<QuestionData>({})

    return (
        <CreateQuestionContext.Provider
            value={{ mode, setMode, files, setFiles, isAdaptive, setIsAdaptive, questionData, setQuestionData }}
        >
            {children}{" "}
        </CreateQuestionContext.Provider>
    );
};

export const useCreateMode = () => {
    const ctx = useContext(CreateQuestionContext);
    if (!ctx) {
        throw new Error(
            "useCreateMode must be used within a QuestionRuntimeProvider"
        );
    }
    return ctx;
};

export default CreateQuestionProvider;
