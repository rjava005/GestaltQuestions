import type { QuizData } from "./types";
import { mapAnswers } from "./utils";

type AnswerTableVariant = "base" | "compact" | "emphasis";

const answerTableStyles: Record<
    AnswerTableVariant,
    {
        wrapper: string;
        th: string;
        td: string;
        row: string;
        pill: string;
    }
> = {
    base: {
        wrapper: "w-full mt-3 rounded-xl border overflow-hidden",
        th: "px-3 py-2 text-left text-xs font-semibold text-gray-500 bg-gray-50",
        td: "px-3 py-2 text-sm text-gray-800",
        row: "border-t",
        pill: "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700",
    },

    compact: {
        wrapper: "w-full mt-2 rounded-lg border text-xs overflow-hidden",
        th: "px-2 py-1 text-left font-semibold text-gray-500 bg-gray-50",
        td: "px-2 py-1 text-xs",
        row: "border-t",
        pill: "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700",
    },

    emphasis: {
        wrapper:
            "w-full mt-4 rounded-xl border-2 border-blue-500 shadow-sm overflow-hidden",
        th: "px-3 py-2 text-left text-xs font-bold text-blue-700 bg-blue-50",
        td: "px-3 py-2 text-sm font-medium",
        row: "border-t border-blue-200",
        pill: "inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800",
    },
};

type DisplayAnswerProps = {
    quizData: QuizData | null;
    submittedAnswer: Record<string, any> | null;
    variant?: AnswerTableVariant;
};


export default function DisplayAnswers({
    quizData,
    submittedAnswer,
    variant = "base",
}: DisplayAnswerProps) {
    if (!quizData) return null;

    const styles = answerTableStyles[variant];
    const mapping = mapAnswers(quizData.correct_answers, submittedAnswer);

    return (
        <div className={styles.wrapper}>
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className={styles.th}>Key</th>
                        <th className={styles.th}>Submitted</th>
                        <th className={styles.th}>Correct</th>
                    </tr>
                </thead>

                <tbody>
                    {mapping.map(({ key, correct, submitted }) => (
                        <tr key={key} className={styles.row}>
                            <td className={styles.td}>{key}</td>

                            <td className={styles.td}>{submitted ?? "—"}</td>

                            <td className={styles.td}>
                                <span className={styles.pill}>{correct}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
