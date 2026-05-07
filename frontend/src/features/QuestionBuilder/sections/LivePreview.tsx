import { Container } from "../../../components/Container";
import { QuestionHTMLToReact } from "../../QuestionEngine";
import { IoLogoJavascript } from "react-icons/io5";
import { FaPython } from "react-icons/fa";
import clsx from "clsx";

type ServerSettings = "static" | "javascript" | "python";

type LivePreviewProps = {
    html: string | null | undefined;
    server_settings?: ServerSettings;
};

const serverMeta: Record<
    ServerSettings,
    { label: string; icon?: React.ReactNode; className: string }
> = {
    static: {
        label: "Static",
        className:
            "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
    },
    javascript: {
        label: "JavaScript",
        icon: <IoLogoJavascript className="h-4 w-4" />,
        className:
            "bg-[var(--color-surface)] text-[var(--color-accent)] border border-[var(--color-border-strong)]",
    },
    python: {
        label: "Python",
        icon: <FaPython className="h-4 w-4" />,
        className:
            "bg-[var(--color-surface)] text-[var(--color-accent-strong)] border border-[var(--color-border-strong)]",
    },
};

export default function LivePreview({
    html,
    server_settings = "static",
}: LivePreviewProps) {
    const meta = serverMeta[server_settings];

    return (
        <Container header="Live Preview">
            <div className="mb-3 flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-soft">
                    Server
                </span>

                {server_settings === "static" ? (
                    <span className={clsx("text-xs font-medium px-2 py-1 rounded-full", meta.className)}>
                        {meta.label}
                    </span>
                ) : (
                    <span
                        className={clsx(
                            "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
                            meta.className
                        )}
                    >
                        {meta.icon}
                        {meta.label}
                    </span>
                )}
            </div>

            <div className="rounded-md border border-border bg-surface-strong p-4 text-text">
                <QuestionHTMLToReact html={html ?? "No Preview Available"} />
            </div>
        </Container>
    );
}
