import api from "../../services/api/client";
import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type FormEvent,
} from "react";
import { useAdaptiveParams } from "../../services";
import { useRawQuestionHTML, useParsedQuestionHTML } from "../../services";
import { useQuestionContext } from "../../context/QuestionContext";
import { useQuestionRuntime } from "../../context/QuestionAnswerContext";
import { trueish } from "../../utils";
import { Error } from "../../components/Generic/Error";
import { Loading } from "../../components/Base/Loading";
import { QuestionHeader } from "./QuestionHeader";
import { QuestionButtons } from "./QuestionButtons";
import DisplayCorrectAnswer from "./DisplayCorrectAnswer";
import QuestionHTMLToReact from "../QuestionComponents/ParseQuestionHTML";
import { getIdToken } from "firebase/auth";

import { useAuth } from "../../context/AuthContext";


export default function QuestionEngine() {
  const { questionMeta: qdata } = useQuestionContext();
  const { answers, setSolution, setShowSolution } = useQuestionRuntime();
  const { user } = useAuth()

  const [formattedQuestion, setFormattedQuestion] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isAdaptive = useMemo(() => trueish(qdata?.isAdaptive), [qdata?.isAdaptive]);

  // Fetch adaptive params if needed
  const { params, loading: pLoading, refetch, error: adaptiveError } = useAdaptiveParams(isAdaptive);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    console.log("Saving the question answers", answers);
    const token = await getIdToken(user)

    const data = await api.post("/run_server/submit", answers, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log("This is the response", data)
    setIsSubmitted(true);
  };

  const generateVariant = useCallback(async () => {
    await refetch();
    setIsSubmitted(false);
  }, [refetch]);

  if (!qdata || adaptiveError) {
    return <Error error={`Failed to get question data: ${adaptiveError ?? ""}`} />;
  }
  if (pLoading) return <Loading />;


  console.log("My Answers", answers)

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

      <div>My Answers{ }</div>

      {isSubmitted && (
        <div className="w-full flex justify-center flex-col items-center mb-10">
          <DisplayCorrectAnswer questionParams={params ?? null} />
        </div>
      )}
    </>
  );
}

