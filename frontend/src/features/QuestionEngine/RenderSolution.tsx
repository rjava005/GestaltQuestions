import { QuestionHTMLToReact } from "../QuestionComponents";
import { useQuestionEngineContext } from ".";

export default function RenderSolution() {
    const { solution } = useQuestionEngineContext();

    return <QuestionHTMLToReact html={solution}></QuestionHTMLToReact>;
}
