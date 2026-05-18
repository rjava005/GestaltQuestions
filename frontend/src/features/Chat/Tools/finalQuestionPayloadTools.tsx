import type { ToolExecute, RenderPreviewProps, UnknownRecord } from "../instance/types";
import type { QuestionCreate } from "../../QuestionBuilder";
import { extractToolPayload } from "../utils/parsingUtils"
import type { ToolMessage } from "langchain";
import { Container } from "../../../components/Container";
import { useState, useMemo } from "react";
import { Button } from "../../../components/Button";
import QuestionBuilderAPI from "../../QuestionBuilder/questionBuilderApi";
import { toast } from "react-toastify"
type QuestionPreviewPayload = {
    files: File[]
    metadata: QuestionCreate;
};

export function parseQuestionPayload(msg: ToolMessage): QuestionPreviewPayload {
    type PayloadFile = {
        filename: string;
        extension?: string;
        content: string;
    };

    const payload = extractToolPayload(msg);
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid tool payload for final_question_payload");
    }

    const obj = payload as UnknownRecord;

    const qMeta =
        "metadata" in obj && obj.metadata && typeof obj.metadata === "object"
            ? (obj.metadata as QuestionCreate)
            : null;

    if (!qMeta) {
        throw new Error("Cannot parse metadata for the question");
    }

    const rawFiles = "files" in obj ? obj.files : null;

    const filePayload: File[] = Array.isArray(rawFiles)
        ? rawFiles
            .filter(
                (f): f is PayloadFile =>
                    !!f &&
                    typeof f === "object" &&
                    "filename" in f &&
                    typeof (f as PayloadFile).filename === "string" &&
                    "content" in f &&
                    typeof (f as PayloadFile).content === "string",
            )
            .map((f) => new File([f.content], f.filename, { type: "text/plain" }))
        : rawFiles && typeof rawFiles === "object"
            ? Object.entries(rawFiles as Record<string, unknown>).map(([filename, content]) =>
                new File([typeof content === "string" ? content : JSON.stringify(content)], filename, {
                    type: "text/plain",
                }),
            )
            : [];
    return { files: filePayload, metadata: qMeta };
}

function applySubmissionMetadata(metadata: QuestionCreate): QuestionCreate {
    return {
        ...metadata,
        ai_generated: true,
    };
}
export const submitFinalQuestionPayload: ToolExecute<QuestionPreviewPayload> = async ({ payload, ctx }) => {
    const token = ctx?.token;
    if (!token) throw new Error("Missing auth token");
    const metadata = applySubmissionMetadata(payload.metadata);

    try {
        const qCreated = await QuestionBuilderAPI.createQuestion(token, metadata);
        const qId = qCreated.id
        if (payload.files) {
            await QuestionBuilderAPI.uploadFiles(token, qId, payload.files);
        }
        toast.success("Created question success")
    } catch (error) {
        console.log(error)
        toast.error("Created question failed")
    }
};

function MetadataRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-border last:border-b-0">
            <div className="text-text-muted text-sm">{label}</div>
            <div className="text-text text-sm wrap-break-word">{value}</div>
        </div>
    );
}

function renderValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined) return <span className="text-text-muted">-</span>;
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.length ? value.join(", ") : <span className="text-text-muted">[]</span>;
    return <code className="text-xs">{JSON.stringify(value)}</code>;
}
export function QuestionReviewCard({
    payload,
    onApprove,
    onCancel,
    loading,
    error,
}: RenderPreviewProps<QuestionPreviewPayload>) {
    const [isEditing, setIsEditing] = useState(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const isReadOnly = submitted || !onApprove;

    // Local editable copy of metadata
    const [draftMetadata, setDraftMetadata] = useState<QuestionCreate>({
        ...(payload.metadata ?? {}),
    });

    // Optional helpers for controlled inputs
    const title = typeof draftMetadata.title === "string" ? draftMetadata.title : "";
    const [topicsInput, setTopicsInput] = useState(
        Array.isArray(payload.metadata?.topics) ? payload.metadata.topics.join(", ") : ""
    );
    const [qTypeInput, setQTypeInputs] = useState(
        Array.isArray(payload.metadata?.qTypes) ? payload.metadata.qTypes.join(", ") : ""
    );

    const updateTitle = (value: string) => {
        setDraftMetadata((prev) => ({ ...prev, title: value }));
    };

    const updateTopics = (value: string) => {
        setTopicsInput(value); // keep exactly what user typed

        const topics = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        setDraftMetadata((prev) => ({ ...prev, topics }));
    };

    const updateQType = (value: string) => {
        setQTypeInputs(value); // keep exactly what user typed

        const qtypes = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        setDraftMetadata((prev) => ({ ...prev, qtypes }));
    };

    const previewPayload = useMemo<QuestionPreviewPayload>(
        () => ({
            ...payload,
            metadata: draftMetadata,
        }),
        [payload, draftMetadata],
    );

    const metadataEntries = Object.entries(
        (draftMetadata ?? {}) as Record<string, unknown>,
    );

    const handleApprove = async () => {
        if (!onApprove || submitted || loading) return;
        await onApprove(previewPayload);
        setSubmitted(true);
        setIsEditing(false);
    };

    return (
        <Container header="Question Metadata Review">
            <div className="rounded-md border border-border bg-surface p-3 space-y-3">
                {/* ...files block... */}

                <div className="rounded-md border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-text font-medium">Metadata</div>
                        <Button
                            name={isEditing ? "Stop Editing" : "Edit"}
                            onClick={() => setIsEditing((v) => !v)}
                            disabled={loading || isReadOnly}
                            color="transparent"
                            size="sm"
                        />
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <label className="text-text-muted text-sm">Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => updateTitle(e.target.value)}
                                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-text-muted text-sm">Topics (comma-separated)</label>
                                <input
                                    value={topicsInput}
                                    onChange={(e) => updateTopics(e.target.value)}
                                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-muted text-sm">QTypes (comma-separated)</label>
                                <input
                                    value={qTypeInput}
                                    onChange={(e) => updateQType(e.target.value)}
                                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    ) : null}

                    {/* Always render from draft so Stop Editing shows new values */}
                    {metadataEntries.map(([key, value]) => (
                        <MetadataRow key={key} label={key} value={renderValue(value)} />
                    ))}
                </div>

                {error ? <div className="text-sm text-red-500">{error}</div> : null}

                <div className="flex gap-2 pt-1">
                    <Button name="Cancel" onClick={onCancel} disabled={loading} color="transparent" size="sm" />
                    <Button
                        name={submitted ? "Question Created" : loading ? "Submitting..." : "Looks Good, Create Question"}
                        onClick={handleApprove}
                        disabled={loading || isReadOnly}
                        color="primary"
                        size="sm"
                    />
                </div>

                {isReadOnly ? (
                    <div className="text-xs text-text-muted">
                        This question is approved and now read-only.
                    </div>
                ) : null}
            </div>
        </Container>
    );
}
