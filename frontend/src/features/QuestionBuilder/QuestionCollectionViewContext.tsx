import React, { createContext, useContext, useState } from "react";

/* =======================
   Types & Constants
======================= */

export type QuestionCollectionView =
    | "all"
    | "current"
    | "drafts"
    | "published"
    | "archived";

export const QuestionCollectionViewLabels: Record<
    QuestionCollectionView,
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

type QuestionCollectionViewContextType = {
    view: QuestionCollectionView;
    setView: React.Dispatch<
        React.SetStateAction<QuestionCollectionView>
    >;
};

export const QuestionCollectionViewContext =
    createContext<QuestionCollectionViewContextType>({
        view: "all",
        setView: () => { },
    });

/* =======================
   Provider
======================= */

const QuestionCollectionViewProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [view, setView] =
        useState<QuestionCollectionView>("current");

    return (
        <QuestionCollectionViewContext.Provider
            value={{ view, setView }}
        >
            {children}
        </QuestionCollectionViewContext.Provider>
    );
};

export default QuestionCollectionViewProvider;

/* =======================
   Hook
======================= */

export function useQuestionCollectionViewContext() {
    const context = useContext(QuestionCollectionViewContext);
    if (!context) {
        throw new Error(
            "useQuestionCollectionViewContext must be used within a QuestionCollectionViewProvider"
        );
    }
    return context;
}
