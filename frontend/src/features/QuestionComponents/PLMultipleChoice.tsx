import clsx from "clsx";
import { useEffect, useState } from "react";
import React from "react";
import { useQuestionRuntime } from "../../context/QuestionAnswerContext";

export type PLAnswerProps = {
    correct: "true" | "false";
    children?: React.ReactNode;
};

export const PLAnswer: React.FC<PLAnswerProps> = ({ children }) => {
    return <>{children}</>;
};

const variantStyles: Record<string, string> = {
    default: "border-gray-300 shadow-sm",
    minimal: "border-transparent bg-gray-50 hover:bg-gray-100",
};

export type PLMultipleChoiceProps = {
    answersName: string;
    multiple: boolean;
    weight?: number;
    inline?: boolean;
    style?: keyof typeof variantStyles;
    showCorrectness?: boolean;
    children?: React.ReactNode;
};

export const PLMultipleChoice: React.FC<PLMultipleChoiceProps> = ({
    answersName,
    multiple = false,
    inline = false,
    showCorrectness = false,
    style = "default",
    children,
}) => {
    const [selected, setSelected] = useState<string[]>([]);

    const { setAnswer } = useQuestionRuntime();

    const answersText = React.Children.toArray(children).filter(
        (child): child is React.ReactElement<PLAnswerProps> =>
            React.isValidElement(child)
    );

    const handleChange = (answer: string) => {
        if (multiple) {
            setSelected((prev) =>
                prev.includes(answer)
                    ? prev.filter((v) => v !== answer)
                    : [...prev, answer]
            );
        } else {
            setSelected([answer]);
        }
    };
    useEffect(() => setAnswer(answersName, selected), [selected]);

    return (
        <div
            className={clsx(
                "flex",
                inline ? "flex-row gap-6" : "flex-col gap-2",
                "py-3 px-3",
                variantStyles[style]
            )}
        >
            <label className="block mb-2 text-sm font-medium text-slate-700">
                {answersName}
            </label>
            {answersText.map((answer, index) => {
                const isCorrect = answer.props.correct === "true";
                const answerValue = answer.props.children as string;

                return (
                    <label
                        key={index}
                        className={clsx(
                            "flex items-center gap-2 cursor-pointer",
                            showCorrectness && (isCorrect ? "text-green-600" : "text-red-600")
                        )}
                    >
                        <input
                            type="checkbox"
                            name={answersName}
                            checked={selected.includes(answerValue)}
                            onChange={() => handleChange(answerValue)}
                            className="accent-violet-500"
                        />
                        <span>{answer.props.children}</span>
                    </label>
                );
            })}
        </div>
    );
};

export default PLMultipleChoice;
