import { type QuestionAllRow, type QuestionStatus, useFilterGeneralQuestions } from "../QuestionBuilder";
import { QuestionTableBase } from "./components";
import { Container } from "../../components/Container";
import { SearchBar } from "../../components/SearchBar";
import { useState, useMemo } from "react";
import type { TableColumn } from "./instance/types";
import { useAllTableContext } from "./instance/context";
import { useCopyQuestion } from "../QuestionBuilder";
import { Button } from "../../components/Button";

type AllQTableProps = {
    onQuestionSelect: (qid: string) => void;
    selectedQuestionId?: string | null;
};



function TableActions() {
    const selectedIDs = useAllTableContext((state) => state.selectedIDs)
    const multiSelectedEnabled = useAllTableContext((state) => state.multiselect)
    const { copyQuestion } = useCopyQuestion()

    const enabled = !selectedIDs.length || !multiSelectedEnabled
    return <div className="ml-auto flex items-center gap-3">

        <Button
            disabled={enabled}
            onClick={() => copyQuestion(selectedIDs)}
            name="Copy"
            color="secondary"
            size="sm"
            className="min-w-27.5"
        />

    </div>
}
export default function AllQuestionTable({
    onQuestionSelect,
    selectedQuestionId,
}: AllQTableProps) {
    const [debouncedSearchTitle, setDebouncedSearchTitle] = useState("");
    const filter = useMemo(() => ({ title: debouncedSearchTitle, status: "published" as QuestionStatus }), [debouncedSearchTitle]);

    const { questions } = useFilterGeneralQuestions(filter);
    const setQuestionIds = useAllTableContext((state) => state.setSelectedIDs);
    const selectedIDs = useAllTableContext((state) => state.selectedIDs);
    const multiSelectedEnabled = useAllTableContext((state) => state.multiselect);

    const questionSummaryColumns: TableColumn[] = [
        { key: "select" },
        {
            key: "title",
            render: (q) => {
                const question = q as QuestionAllRow;
                const isSelected = question.question_id === selectedQuestionId;

                return (
                    <button
                        type="button"
                        onClick={() => onQuestionSelect(question.question_id)}
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
        { key: "isAdaptive", render: (q) => ((q as QuestionAllRow).isAdaptive ? "Yes" : "No") },
        { key: "status", render: (q) => (q as QuestionAllRow).status },
        { key: "created_by", render: (q) => (q as QuestionAllRow).created_by || "—" },
        { key: "institution", render: (q) => (q as QuestionAllRow).institution || "—" },
    ];

    const rows = questions.map((q) => ({ ...q, id: q.question_id }));

    return (
        <Container header="All Questions">
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
                questions={rows}
                columns={questionSummaryColumns}
                onTitleClick={(v) => onQuestionSelect(v.id)}
                onSelectedIdsChange={setQuestionIds}
                selectedIds={selectedIDs}
            />
        </Container>
    );
}
