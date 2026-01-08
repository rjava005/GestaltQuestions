import { Header } from "../../components/Header";
import Divider from "../../components/Divider/Divider";
import { Section } from "../../components/Section";

import ModeToggle from "./ModeToggle";
import { useCreateMode } from "./context";
import { CreateQuestionFromBlank } from "./CreateQuestionFromBlank";

import { Button } from "../../components/Button";
import UploadZipQuestionModal from "./UploadZipQuestionModal";

export default function CreateQuestion() {
    const { mode } = useCreateMode();


    return (
        <Section variant="questionBuilder" id="create-question" className="gap-3">
            <Header
                variant={"QuestionBuilder"}
                title="Create Question"
                className="flex flex-row justify-between "
            >

            </Header>
            <Divider />
            <ModeToggle />
            {mode === "blank" ? <CreateQuestionFromBlank /> : <UploadZipQuestionModal setShowModal={() => { }} />}
        </Section>
    );
}
