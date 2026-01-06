type mappedAnswers = {
    key: string;
    correct: number | string;
    submitted: number | string | null;
};
export function mapAnswers(
    correctAnswers: Record<string, any>,
    submittedAnswers: Record<string, any> | null
): mappedAnswers[] {
    return Object.entries(correctAnswers).map(([key, correctValue]) => {
        const submittedValue =
            submittedAnswers && key in submittedAnswers
                ? submittedAnswers[key]
                : null;

        return {
            key,
            correct: correctValue,
            submitted: submittedValue,
        };
    });
}