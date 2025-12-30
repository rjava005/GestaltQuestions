import { Header } from "../../components/Header";
import Divider from "../../components/Base/Divider";
import { Section } from "../../components/Section";

import ModeToggle from "./ModeToggle";
import { useCreateMode } from "./context";
import { CreateQuestionFromBlank } from "./CreateQuestionFromBlank";

import { Button } from "../../components/Button/Button";

export default function CreateQuestion() {
  const { mode } = useCreateMode();
  return (
    <Section variant="questionBuilder" id="create-question" className="gap-3">
      <Header
        style={"QuestionBuilder"}
        title="Create Question"
        className="flex flex-row justify-between "
      >
        <div className="flex flex-row gap-4">
          <Button size="md" name="Save" className="grow" />
          <Button size="md" name="Cancel" color="secondary" className="grow" />
        </div>
      </Header>
      <Divider />
      <ModeToggle />

      {mode === "blank" && <CreateQuestionFromBlank />}
    </Section>
  );
}
