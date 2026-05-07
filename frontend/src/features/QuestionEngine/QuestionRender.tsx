import { useState, type FormEvent } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { ServerSettings } from "../QuestionBuilder/components/ServerToggle";
import {
    QuestionInstanceProvider,
    useQuestionInstance,
    useRunQuestion,
} from "./instance";
import QuestionHTMLToReact from "./render/QuestionHtmlToReact";
import { Error } from "../../components/Error";
import { Button } from "../../components/Button";
import { DisplayAnswers, QuestionHeader } from "./ui";
type QuestionRenderProps = {
    qid: string | null;
    serverSettings: ServerSettings;
};

function QuestionRenderBody({ qid, serverSettings }: QuestionRenderProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [showSolution, setShowSolution] = useState<boolean>(false);
    useRunQuestion(qid, serverSettings, refreshKey);

    // Unpack
    const loading = useQuestionInstance((s) => s.loading);
    const error = useQuestionInstance((s) => s.error);
    const qhtml = useQuestionInstance((s) => s.questionHtml);
    const shtml = useQuestionInstance(
        (s) => s.solutionHtml ?? "No Solution Available for Question",
    );
    const quizData = useQuestionInstance((s) => s.quizData);
    const qmeta = useQuestionInstance((s) => s.questionMeta);
    const answers = useQuestionInstance((s) => s.answers);
    const resetAll = useQuestionInstance((s) => s.resetAll);
    const isSubmitted = useQuestionInstance((s) => s.hasSubmitted);
    const submit = useQuestionInstance((s) => s.submitAnswers);

    if (error) {
        return <Error error={error} variant="codeExecution" />;
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit();
    };
    const handleGenerateVariant = () => {
        setRefreshKey((prev) => prev + 1);
        resetAll();
    };

    if (loading) {
        return <div>Loading</div>;
    }

    return (
        <div className="space-y-4">
            <QuestionHeader qdata={qmeta} />

            <PanelGroup direction="horizontal" className="w-full gap-3">
                <Panel
                    order={1}
                    defaultSize={200}
                    minSize={25}
                    className="rounded-lg border border-border bg-surface p-4"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="text-text">
                            <QuestionHTMLToReact html={qhtml} />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button type="submit" name="Submit" color="submitQuestion" />
                            <Button
                                type="button"
                                onClick={handleGenerateVariant}
                                name="Generate Variant"
                                color="generateVariant"
                            />
                            <Button
                                type="button"
                                onClick={() => setShowSolution((prev) => !prev)}
                                name={showSolution ? "Hide Solution" : "Show Solution"}
                                color="showSolution"
                            />
                        </div>
                    </form>
                    {isSubmitted && (
                        <DisplayAnswers quizData={quizData} submittedAnswer={answers} />
                    )}
                </Panel>

                {showSolution && (
                    <>
                        <PanelResizeHandle className="w-2 rounded-sm bg-border hover:bg-border-strong transition-colors duration-200 cursor-col-resize" />
                        <Panel
                            order={2}
                            defaultSize={200}
                            minSize={25}
                            className="rounded-lg border border-border bg-surface p-4"
                        >
                            <div className="text-text">
                                <QuestionHTMLToReact html={shtml} />
                            </div>
                        </Panel>
                    </>
                )}
            </PanelGroup>
        </div>
    );
}

export default function QuestionRender(props: QuestionRenderProps) {
    return (
        <QuestionInstanceProvider>
            <QuestionRenderBody {...props} />
        </QuestionInstanceProvider>
    );
}
