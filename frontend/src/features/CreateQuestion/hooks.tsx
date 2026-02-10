import { useCreateMode } from "./context"
import { QuestionAPI } from "../../services"
import { QUESTION_FILE_SPECS } from "./config"
import { toast } from "react-toastify"


export function useQuestionCreation() {
    const { files, isAdaptive, questionData, additionalFiles } = useCreateMode();

    const createQuestion = async () => {
        try {
            if (!files.length) {
                toast.error("No files selected for this question.");
                return;
            }

            if (!questionData.title?.trim()) {
                toast.error("Question title is required.");
                return;
            }

            /* -----------------------------
             Build templates
            ------------------------------ */
            const content = QUESTION_FILE_SPECS.filter((v) =>
                files.includes(v.filename)
            );

            if (!content.length) {
                toast.error("No valid templates matched the selected files.");
                return;
            }

            const templates = content.map((v) => {
                const selected = v.template.find(
                    (t) => t.adaptive === isAdaptive
                );

                if (!selected) {
                    throw new Error(
                        `No template found for ${v.filename} (adaptive=${isAdaptive})`
                    );
                }

                return {
                    filename: v.filename,
                    template: selected.template,
                };
            });

            /* -----------------------------
             Create upload files
            ------------------------------ */
            const uploadFiles: File[] = [
                ...templates.map(
                    (v) =>
                        new File([v.template], v.filename, {
                            type: "text/html",
                        })
                ),
                ...(additionalFiles ? Array.from(additionalFiles) : []),
            ];


            /* -----------------------------
             Submit
            ------------------------------ */
            await QuestionAPI.createWithFiles(
                {
                    ...questionData,
                    ai_generated: false, // avoid mutating context
                },
                uploadFiles
            );

            toast.success("Question created successfully 🎉");
        } catch (error: unknown) {
            /* -----------------------------
             Error handling
            ------------------------------ */
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to create question. Please try again.");
            }
        }
    };

    return { createQuestion };
}