import { createContext, useContext, useState, type ReactNode } from "react";

type QuestionTableContextType = {
    multiSelect: boolean;
    setMultiSelect: React.Dispatch<React.SetStateAction<boolean>>;
    resetKey: number;
    setResetKey: React.Dispatch<React.SetStateAction<number>>;
};

export const QuestionTableContext =
    createContext<QuestionTableContextType | null>(null);

export function QuestionTableProvider({ children }: { children: ReactNode }) {
    const [multiSelect, setMultiSelect] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    return (
        <QuestionTableContext.Provider
            value={{ multiSelect, setMultiSelect, resetKey, setResetKey }}
        >
            {children}
        </QuestionTableContext.Provider>
    );
}

export function useQuestionTableContext() {
    const context = useContext(QuestionTableContext);

    if (!context) {
        throw new Error(
            "useQuestionContext must be used within a <QuestionProvider>"
        );
    }

    return context;
}
