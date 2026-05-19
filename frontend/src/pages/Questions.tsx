import AllQuestionTable from "../features/QuestionTables/AllQuestionTable"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom";
import { QuestionRender } from "../features/QuestionEngine";
import { ServerModeSwitch, type ServerSettings } from "../features/QuestionBuilder/components/ServerToggle";
import { useState } from "react";

export default function Question() {
    const navigate = useNavigate();
    return <div>
        <AllQuestionTable onQuestionSelect={(qid) => navigate(`/questions/${qid}`)} />
    </div>
}
export function GeneralQuestionRender() {
    const { qid } = useParams<{ qid: string }>();
    const [serverMode, setServerMode] = useState<ServerSettings>("javascript")
    if (!qid) return;

    return <div className="flex flex-col w-full gap-3">
        <ServerModeSwitch value={serverMode} onChange={(value) => setServerMode(value)} />

        <QuestionRender qid={qid} serverSettings={serverMode} />
    </div>
}
