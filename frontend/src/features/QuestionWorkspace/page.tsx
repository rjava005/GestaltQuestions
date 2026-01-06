import { Header } from "../../components/Header";
import { QuestionEditorSections } from "./QuestionEditorSections";
import { useQuestionWorkspaceContext } from "./context";
import { QuestionEngine } from "../QuestionEngine";
import { QuestionEditor } from "../QuestionEditor";
const Mockdata = {
  title: "Adding 2 Numbers",
};

export default function QuestionWorkspace() {
  const { option } = useQuestionWorkspaceContext();
  return (
    <div className="flex flex-col">
      <Header title={Mockdata.title} />
      <QuestionEditorSections />
      <div className="w-full h-8/10">
        {option === "code" ? (
          <QuestionEditor />
        ) : option === "question" ? (
          <QuestionEngine />
        ) : (
          <div>{option}</div>
        )}
      </div>
    </div>
  );
}
