
import { Header } from "../../components/Header";
import Divider from "../../components/Base/Divider";
import { Section } from "../../components/Section";
import { Button } from "../../components/Button/Button";
import QuestionMeta from "./QuestionMetadataField";

const Templates = ["TemplateA", "TemplateB", "TemplateC", "TemplateD"];

function SelectFiles() {
    return (
        <div>
            {/* Header portion */}
            <div>
                <h1>Select Files</h1>
            </div>
            {/* Container */}
            <div>
                <h1>Available Files</h1>
                {Templates.map((v) => (
                    <p>{v}</p>
                ))}
            </div>
        </div>
    );
}

export default function CreateQuestion() {
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
            <QuestionMeta />
            <Divider />
            {/* Question Creation */}
            <SelectFiles />
        </Section>
    );
}
