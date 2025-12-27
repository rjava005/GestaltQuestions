import React, { createContext, useContext, useState } from "react";

/* =======================
   Types & Constants
======================= */

export type QuestionCollectionFilter =
    | "all"
    | "current"
    | "drafts"
    | "published"
    | "archived";

export const QuestionCollectionFilterLabels: Record<
    QuestionCollectionFilter,
    string
> = {
    all: "All Questions",
    current: "Current",
    drafts: "Drafts",
    published: "Published",
    archived: "Archived",
};

/* =======================
   Context Definition
======================= */

type QuestionCollectionContextType = {
    filter: QuestionCollectionFilter;
    setFilter: React.Dispatch<
        React.SetStateAction<QuestionCollectionFilter>
    >;
};

export const QuestionCollectionContext =
    createContext<QuestionCollectionContextType>({
        filter: "all",
        setFilter: () => { },
    });

/* =======================
   Provider
======================= */

const QuestionCollectionProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [filter, setFilter] =
        useState<QuestionCollectionFilter>("current");

    return (
        <QuestionCollectionContext.Provider
            value={{ filter, setFilter }}
        >
            {children}
        </QuestionCollectionContext.Provider>
    );
};

export default QuestionCollectionProvider;

/* =======================
   Hook
======================= */

export function useQuestionCollectionContext() {
    const context = useContext(QuestionCollectionContext);
    if (!context) {
        throw new Error(
            "useQuestionCollectionContext must be used within a QuestionCollectionProvider"
        );
    }
    return context;
}
