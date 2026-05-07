import clsx from "clsx";

import type {
  QuizData,
  QuestionAnswerMap,
  QuestionValue,
} from "../../instance/types";

type AnswerTableVariant = "default" | "compact" | "emphasis";

const variantClasses: Record<AnswerTableVariant, string> = {
  default: "",
  compact: "qr-answer-card--compact",
  emphasis: "qr-answer-card--emphasis",
};

type AnswerComparisonRow = {
  key: string;
  correct: QuestionValue;
  submitted: QuestionValue;
};

function buildAnswerComparisonRows(
  correctAnswers: QuestionAnswerMap,
  submitted: QuestionAnswerMap | null,
): AnswerComparisonRow[] {
  return Object.entries(correctAnswers).map(([key, correctValue]) => {
    const submittedValue =
      submitted && key in submitted ? submitted[key] : null;
    return {
      key,
      correct: correctValue,
      submitted: submittedValue,
    };
  });
}

type DisplayAnswerProps = {
  quizData: QuizData | null;
  submittedAnswer?: QuestionAnswerMap | null; // Backward-compatible prop
  variant?: AnswerTableVariant;
};

export default function DisplayAnswers({
  quizData,
  submittedAnswer,
  variant = "default",
}: DisplayAnswerProps) {
  if (!quizData) return null;

  const effectiveResponses = submittedAnswer ?? null;
  const rows = buildAnswerComparisonRows(
    quizData.correct_answers,
    effectiveResponses,
  );

  return (
    <div className={clsx("qr-answer-card", variantClasses[variant])}>
      <table className="qr-answer-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Submitted</th>
            <th>Correct</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, correct, submitted }) => {
            const isMatch = String(submitted ?? "") === String(correct ?? "");
            return (
              <tr
                key={key}
                className={clsx(
                  "qr-answer-row",
                  !isMatch && "qr-answer-row--mismatch",
                )}
              >
                <td>{key}</td>
                <td>{submitted ?? "—"}</td>
                <td>
                  <span className="qr-answer-pill">{String(correct)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
