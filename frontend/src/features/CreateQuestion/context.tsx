import React, { createContext, useState, useContext } from "react";

export type CreateMode = "blank" | "upload";
export type Filenames =
    | "question.html"
    | "solution.html"
    | "server.js"
    | "server.py";
type CreateQuestionContextType = {
    mode: CreateMode;
    setMode: React.Dispatch<React.SetStateAction<CreateMode>>;
    files: Filenames[];
    setFiles: React.Dispatch<React.SetStateAction<Filenames[]>>;
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

    return (
        <CreateQuestionContext.Provider value={{ mode, setMode, files, setFiles }}>
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
