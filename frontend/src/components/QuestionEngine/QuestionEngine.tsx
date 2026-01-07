import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type FormEvent,
} from "react";
import { useAdaptiveParams } from "../../api";
import { useRawQuestionHTML, useParsedQuestionHTML } from "../../api";
import { useQuestionContext } from "../../context/QuestionContext";
import { useQuestionRuntime } from "../../context/QuestionAnswerContext";
import { trueish } from "../../utils";
import { Error } from "../Generic/Error";
import { Loading } from "../Base/Loading";
import { QuestionHeader } from "./QuestionHeader";
import { QuestionButtons } from "./QuestionButtons";
import DisplayCorrectAnswer from "./DisplayCorrectAnswer";
import QuestionHTMLToReact from "../QuestionComponents/ParseQuestionHTML";


export default function QuestionEngine() {
  const { questionMeta: qdata } = useQuestionContext();
  const { answers, setSolution, setShowSolution } = useQuestionRuntime();

  const [formattedQuestion, setFormattedQuestion] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isAdaptive = useMemo(() => trueish(qdata?.isAdaptive), [qdata?.isAdaptive]);

  // Fetch adaptive params if needed
  const { params, loading: pLoading, refetch } = useAdaptiveParams(isAdaptive);

  // Raw question & solution HTML (user edited)
  const { questionHtml, solutionHTML } = useRawQuestionHTML();

  // Parameter substitution for adaptive questions
  const parsed = useParsedQuestionHTML(
    questionHtml ?? "",
    isAdaptive && params ? params : null,
    solutionHTML ?? ""
  );

  useEffect(() => {
    if (parsed) {
      setFormattedQuestion(parsed.qHTML);
      setSolution(parsed.sHTML);
    } else {
      setFormattedQuestion(questionHtml ?? "");
      setSolution(solutionHTML ?? "");
    }
  }, [parsed, questionHtml, solutionHTML, setSolution]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Saving the question answers", answers);
    setIsSubmitted(true);
  };

  const generateVariant = useCallback(async () => {
    await refetch();
    setIsSubmitted(false);
  }, [refetch]);

  if (!qdata) return <Error error="Failed to get question data" />;
  if (pLoading) return <Loading />;

  return (
    <>
      <QuestionHeader question={qdata} />

      <form onSubmit={handleSubmit}>
        <QuestionHTMLToReact html={formattedQuestion} />

        <QuestionButtons
          isSubmitted={isSubmitted}
          handleSubmit={handleSubmit}
          generateVariant={generateVariant}
          showSolution={() => setShowSolution((prev) => !prev)}
        />
      </form>

      {isSubmitted && (
        <div className="w-full flex justify-center flex-col items-center mb-10">
          <DisplayCorrectAnswer questionParams={params ?? null} />
        </div>
      )}
    </>
  );
}

