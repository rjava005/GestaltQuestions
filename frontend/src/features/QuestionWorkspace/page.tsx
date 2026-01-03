import { Header } from "../../components/Header";
import { useQuestionBuildingContext } from "../QuestionBuilder";
import { QuestionEditorSections } from "../QuestionBuilder/QuestionEditorSections";
const Mockdata = {
  title: "Adding 2 Numbers",
};

function MainContent() {
  const { section } = useQuestionBuildingContext();
  return (
    <div className="flex flex-col">
      <Header title={Mockdata.title} />
      <QuestionEditorSections />
      <div className="w-full h-8/10">
        {section === "code" ? <CodeEditorBase /> : <div>{section}</div>}
      </div>
    </div>
  );
}
