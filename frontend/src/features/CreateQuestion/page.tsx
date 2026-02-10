import { Header } from "../../components/Header";
import Divider from "../../components/Divider/Divider";
import { Section } from "../../components/Section";

import ModeToggle from "./ModeToggle";
import { useCreateMode } from "./context";
import { CreateQuestionFromBlank } from "./CreateQuestionFromBlank";
import type { CreateMode } from "./types";
import UploadZipQuestionModal from "./UploadZipQuestionModal";
import { ImageGenerator, TextGenerator } from "../CodeGenerators";

const MODE_COMPONENTS: Record<CreateMode, React.ReactNode> = {
  blank: <CreateQuestionFromBlank />,
  upload: <UploadZipQuestionModal setShowModal={() => {}} />,
  "text-ai": <TextGenerator />,
  "image-ai": <ImageGenerator />,
};

export default function CreateQuestion() {
  const { mode } = useCreateMode();

  return (
    <Section variant="questionBuilder" id="create-question" className="gap-3">
      <Header
        variant="QuestionBuilder"
        title="Create Question"
        className="flex flex-row justify-between"
      />
      <Divider />
      <ModeToggle />

      {MODE_COMPONENTS[mode]}
    </Section>
  );
}
