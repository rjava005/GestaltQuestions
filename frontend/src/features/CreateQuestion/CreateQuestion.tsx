import type { QuestionData } from "../../types/questionTypes";
import { Header } from "../../components/Header";
import Divider from "../../components/Base/Divider";

function QuestionMeta() {
  return <div>Question Metadata</div>;
}

function CreateHeader() {
  return (
    <Header style={"QuestionBuilder"} title="Create Question">
      Content
    </Header>
  );
}

export default function CreateQuestion() {
  return (
    <>
      <CreateHeader />
      <Divider />
    </>
  );
}
