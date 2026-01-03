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

            {mode === "blank" ? <CreateQuestionFromBlank /> : <UploadZipQuestionModal setShowModal={() => { }} />}
        </Section>
    );
}
