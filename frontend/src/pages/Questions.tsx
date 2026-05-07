import AllQuestionTable from "../features/QuestionTables/AllQuestionTable"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom";
import { QuestionRender } from "../features/QuestionEngine";

export default function Question() {
    const navigate = useNavigate();
    return <div>Questions
        <AllQuestionTable onQuestionSelect={(qid) => navigate(`/questions/${qid}`)} />
    </div>
}

export function GeneralQuestionRender() {
    const { qid } = useParams<{ qid: string }>();
    const serverMode = "javascript"
    if (!qid) return;
    return <div className=" flex flex-col w-full ">
        <QuestionRender qid={qid} serverSettings={serverMode} />
    </div>
}