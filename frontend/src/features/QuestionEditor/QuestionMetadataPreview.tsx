import { Container } from "../../components/Container";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useQuestionMetadata, useUpdateQuestion } from "../QuestionBuilder";
import { Button } from "../../components/Button";

type Props = {
    qid: string | null;
};

type RowProps = {
    label: string;
    value: React.ReactNode;
};

function MetadataRow({ label, value }: RowProps) {
    return (
        <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-border last:border-b-0">
            <div className="text-text-muted text-sm">{label}</div>
            <div className="text-text text-sm">{value}</div>
        </div>
    );
}

export default function QuestionMetaDataPreview({ qid }: Props) {
    const { questionMetadata, loading } = useQuestionMetadata(qid);
    const { updateQuestion, loading: saving, error: saveError } = useUpdateQuestion();
    const [title, setTitle] = useState("");
    const [aiGenerated, setAiGenerated] = useState(false);
    const [isAdaptive, setIsAdaptive] = useState(false);
    const [topicsText, setTopicsText] = useState("");
    const [qTypesText, setQTypesText] = useState("");

    useEffect(() => {
        if (!questionMetadata) return;
        setTitle(questionMetadata.title ?? "");
        setAiGenerated(Boolean(questionMetadata.ai_generated));
        setIsAdaptive(Boolean(questionMetadata.isAdaptive));
        setTopicsText(Array.isArray(questionMetadata.topics) ? questionMetadata.topics.join(", ") : "");
        setQTypesText(Array.isArray(questionMetadata.qTypes) ? questionMetadata.qTypes.join(", ") : "");
    }, [questionMetadata]);

    if (!qid) {
        return (
            <Container header="Question Metadata">
                <div className="text-sm text-text-muted">Select a question to view metadata.</div>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container header="Question Metadata">
                <div className="text-sm text-text-muted">Loading metadata...</div>
            </Container>
        );
    }

    if (!questionMetadata) {
        return (
            <Container header="Question Metadata">
                <div className="text-sm text-text-muted">No metadata available.</div>
            </Container>
        );
    }

    const normalizeList = (value: string) =>
        value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    const currentTopics = Array.isArray(questionMetadata.topics) ? questionMetadata.topics : [];
    const currentQTypes = Array.isArray(questionMetadata.qTypes) ? questionMetadata.qTypes : [];
    const nextTopics = normalizeList(topicsText);
    const nextQTypes = normalizeList(qTypesText);
    const hasChanges =
        (questionMetadata.title ?? "") !== title ||
        questionMetadata.ai_generated !== aiGenerated ||
        questionMetadata.isAdaptive !== isAdaptive ||
        currentTopics.join("|") !== nextTopics.join("|") ||
        currentQTypes.join("|") !== nextQTypes.join("|");

    const onSubmit = async () => {
        if (!qid) return;
        const normalizeList = (value: string) =>
            value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

        const updated = await updateQuestion(qid, {
            title: title.trim(),
            ai_generated: aiGenerated,
            isAdaptive,
            topics: normalizeList(topicsText),
            qTypes: normalizeList(qTypesText),
        });

        if (updated) {
            toast.success("Question metadata updated.");
        }
    };

    return (
        <Container header="Question Metadata">
            <div className="rounded-md border border-border bg-surface p-3 space-y-3">
                <MetadataRow label="Status" value={questionMetadata.status} />

                <div className="space-y-1">
                    <label className="text-text-muted text-sm">Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-text">
                    <input
                        type="checkbox"
                        checked={aiGenerated}
                        onChange={(e) => setAiGenerated(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                    />
                    AI Generated
                </label>

                <label className="flex items-center gap-2 text-sm text-text">
                    <input
                        type="checkbox"
                        checked={isAdaptive}
                        onChange={(e) => setIsAdaptive(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                    />
                    Adaptive
                </label>

                <div className="space-y-1">
                    <label className="text-text-muted text-sm">Topics (comma-separated)</label>
                    <input
                        value={topicsText}
                        onChange={(e) => setTopicsText(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-text-muted text-sm">Question Types (comma-separated)</label>
                    <input
                        value={qTypesText}
                        onChange={(e) => setQTypesText(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                </div>

                {saveError && <div className="text-sm text-red-500">{saveError}</div>}

                <div className="pt-1">
                    <Button
                        name={saving ? "Saving..." : "Save Metadata"}
                        onClick={onSubmit}
                        disabled={saving || !hasChanges}
                        color="primary"
                        size="sm"
                    />
                </div>
            </div>
        </Container>
    );
}
