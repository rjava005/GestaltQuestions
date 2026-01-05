import { createContext, useState, useContext } from "react";

type ServerSetting = "javascript" | "python";

type QuestionEngineContext = {
    serverSetting: ServerSetting;
    setServerSetting: React.Dispatch<React.SetStateAction<ServerSetting>>;
};

export const QuestionEngineContext = createContext<QuestionEngineContext>({
    serverSetting: "javascript",
    setServerSetting: () => { },
});

const QuestionEngineProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [serverSetting, setServerSetting] =
        useState<ServerSetting>("javascript");

    return (
        <QuestionEngineContext.Provider value={{ serverSetting, setServerSetting }}>
            {children}
        </QuestionEngineContext.Provider>
    );
};

export default QuestionEngineProvider

export function useQuestionEngineContext() {
    const context = useContext(QuestionEngineContext);
    if (context === undefined) {
        throw new Error(
            "useSelectedQuestion must be used within a SelectedQuestionProvider"
        );
    }
    return context;
}
