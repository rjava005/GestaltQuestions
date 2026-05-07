import clsx from "clsx";
import { useState } from "react";
import React from "react";

import { uiChoiceStyles, uiInputStyles } from "../../../styles";

export type PLAnswerProps = {
    correct: "true" | "false";
    children?: React.ReactNode;
};

export const PLAnswer: React.FC<PLAnswerProps> = ({ children }) => {
    return <>{children}</>;
};

const variantStyles: Record<string, string> = {
    default: "bg-[var(--color-surface)] border border-[var(--color-border)]",
    minimal: "bg-[var(--color-surface-muted)] border border-transparent",
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

    // useEffect(() => setResponse(answersName, selected), [answersName, selected, setResponse]);

    return (
        <div
            className={clsx(
                "flex py-3 px-3 rounded-md",
                inline ? "flex-row gap-6 items-center" : "flex-col gap-2",
                variantStyles[style]
            )}
        >
            <label className={uiChoiceStyles.label}>{answersName}</label>
            <div className={clsx("flex", inline ? "flex-row gap-4" : "flex-col gap-2")}>
                {answersText.map((answer, index) => {
                    const isCorrect = answer.props.correct === "true";
                    const answerValue = answer.props.children as string;

                    return (
                        <label
                            key={index}
                            className={clsx(
                                uiChoiceStyles.option,
                                showCorrectness &&
                                    (isCorrect
                                        ? uiChoiceStyles.optionCorrect
                                        : uiChoiceStyles.optionIncorrect)
                            )}
                        >
                            <input
                                type={multiple ? "checkbox" : "radio"}
                                name={answersName}
                                checked={selected.includes(answerValue)}
                                onChange={() => handleChange(answerValue)}
                                className={clsx(
                                    uiChoiceStyles.checkbox,
                                    uiInputStyles.base,
                                    "h-4 w-4 max-w-4 p-0"
                                )}
                            />
                            <span className="text-text">{answer.props.children}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

export default PLMultipleChoice;
