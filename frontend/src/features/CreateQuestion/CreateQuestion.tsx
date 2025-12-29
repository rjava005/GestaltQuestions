import type { QuestionData } from "../../types/questionTypes";
import { Header } from "../../components/Header";
import Divider from "../../components/Base/Divider";
import { Section } from "../../components/Section";
function QuestionMeta() {
  return <div>Question Metadata</div>;
}

export default function CreateQuestion() {
  return (
    <Section variant="questionBuilder" id="create-question">
      <Header style={"QuestionBuilder"} title="Create Question">
        
      </Header>

      <Divider />
    </Section>
  );
}
