import { type QuestionRead } from "../QuestionBuilder";
import { QuestionTableBase } from "./components";
import { Container } from "../../components/Container";
import { SearchBar } from "../../components/SearchBar";
import { useFilterMyQuestions } from "../QuestionBuilder";
import { useState, useMemo } from "react";
import type { TableColumn } from "./instance/types";
import { Button } from "../../components/Button";
import { useDevTableContext } from "./instance/context";
import { useDeleteQuestion, useDownloadQuestions, useCopyQuestion } from "../QuestionBuilder";


type DevQTableProps = {
    onQuestionSelect: (qid: string) => void;
    selectedQuestionId?: string | null;
};

function TableActions() {
    const selectedIDs = useDevTableContext((state) => state.selectedIDs)
    const multiSelectedEnabled = useDevTableContext((state) => state.multiselect)
    const { deleteQuestion } = useDeleteQuestion()
    const { downLoadQuestions } = useDownloadQuestions()
    const { copyQuestion } = useCopyQuestion()

    const enabled = !selectedIDs.length || !multiSelectedEnabled
    return <div className="ml-auto flex items-center gap-3">
        <Button
            disabled={enabled}
            onClick={() => downLoadQuestions(selectedIDs)}
            name="Download"
            color="primary"
            size="sm"
            className="min-w-[110px]"
        />
        <Button
            disabled={enabled}
            onClick={() => copyQuestion(selectedIDs)}
            name="Copy"
            color="secondary"
            size="sm"
            className="min-w-[110px]"
        />
        <Button
            disabled={enabled}
            onClick={() => deleteQuestion(selectedIDs)}
            name="Delete"
            color="danger"
            size="sm"
            className="min-w-[110px]"
        />
    </div>
}

export default function DevQuestionTable({
    onQuestionSelect,
    selectedQuestionId,
}: DevQTableProps) {
    // Search bar debounce 
    const [debouncedSearchTitle, setDebouncedSearchTitle] = useState("");
    const filter = useMemo(
        () => ({ title: debouncedSearchTitle }),
        [debouncedSearchTitle],
    );
    const { questions } = useFilterMyQuestions(filter);
    const setQuestionIds = useDevTableContext((state) => state.setSelectedIDs)
    const selectedIDs = useDevTableContext((state) => state.selectedIDs)
    const multiSelectedEnabled = useDevTableContext((state) => state.multiselect)
    const QuestionSummaryColumns: TableColumn[] = [
        {
            key: "select",
        },
        {
            key: "title",
            render: (q) => {
                const question = q as QuestionRead;
                const isSelected = question.id === selectedQuestionId;
                return (
                    <button
                        type="button"
                        onClick={() => onQuestionSelect(question.id)}
                        className={
                            isSelected
                                ? "font-semibold text-accent underline"
                                : "text-text hover:text-accent"
                        }
                    >
                        {question.title ?? "Untitled"}
                    </button>
                );
            },
        },
        {
            key: "isAdaptive",
            render: (q) => ((q as QuestionRead).isAdaptive ? "Yes" : "No"),
        },
        {
            key: "topics",
            render: (q) =>
                (q as QuestionRead).topics.length
                    ? (q as QuestionRead).topics.join(", ")
                    : "—",
        },
        {
            key: "qTypes",
            render: (q) =>
                (q as QuestionRead).qTypes.length
                    ? (q as QuestionRead).qTypes.join(", ")
                    : "—",
        },
    ];

    return (
        <Container header="My Questions">
            <div className="flex flex-row items-center gap-3">
                <SearchBar
                    value={debouncedSearchTitle}
                    setValue={setDebouncedSearchTitle}
                    disabled={false}
                />
                <TableActions />
            </div>
            <QuestionTableBase
                multiSelect={multiSelectedEnabled}
                questions={questions}
                columns={QuestionSummaryColumns}
                onTitleClick={(v) => onQuestionSelect(v.id)}
                onSelectedIdsChange={setQuestionIds}
                selectedIds={selectedIDs}
            ></QuestionTableBase>
        </Container>
    );
}
