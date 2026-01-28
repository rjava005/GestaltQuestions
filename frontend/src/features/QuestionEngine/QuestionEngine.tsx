import { useEffect, useState, type FormEvent } from "react";

import { QuestionHeader } from "./QuestionHeader";
import { useQuestion, useCurrentQuestionMeta } from "./hooks";
import { QuestionHTMLToReact } from "../QuestionComponents";
import DisplayAnswers from "./DisplayAnswers";
import { useQuestionEngineContext } from "./context";

import { Section } from "../../components/Section";
import { Button } from "../../components/Button";
import { Loading } from "../../components/Loading";
import { Error } from "../../components/Error";

import { useQuestionRuntime } from "../../context/QuestionAnswerContext";

export default function QuestionEngine() {
  /* =========================
     Question + Runtime State
  ========================= */
  const { formattedQuestion, formattedSolution, error, loading, refetch, params } = useQuestion({
    isAdaptive: true,
  });

  const { questionMeta } = useCurrentQuestionMeta();
  const { setShowSolution, setSolution } = useQuestionEngineContext();
  const { answers } = useQuestionRuntime();

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => setSolution(formattedSolution ?? ""), [formattedSolution])

  /* =========================
     Guard States
  ========================= */
  if (!questionMeta) {
    return <div>Error: Could not get question</div>;
  }

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} />;
  }

  /* =========================
     Handlers
  ========================= */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  /* =========================
     Render
  ========================= */
  return (
    <Section className="w-9/10">
      <div className="rounded-md border-2 border-gray-400">
        <QuestionHeader question={questionMeta} />

        <form onSubmit={handleSubmit}>
          <QuestionHTMLToReact html={formattedQuestion} />

          {/* Action Button Toolbar */}
          <div className="grid sm:grid-cols-3 gap-10 mb-10">
            <Button
              name="Generate Variant"
              color="generateVariant"
              onClick={refetch}
            />

            <Button name="Submit Answer" color="submitQuestion" type="submit" />

            <Button
              name="Show Solution"
              color="showSolution"
              onClick={() => setShowSolution((prev) => !prev)}
            />
          </div>
        </form>

        {isSubmitted && (
          <div className="w-full flex flex-col items-center justify-center mb-10">
            <DisplayAnswers quizData={params} submittedAnswer={answers} />
          </div>
        )}
      </div>
    </Section>
  );
}
