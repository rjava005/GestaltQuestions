import { QuestionAPI } from "../../services";
import { toast } from "react-toastify";
import { downloadZip } from "../../utils/downloadUtils";
import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";

export function useQuestionToolBarActions() {
  const { selectedQuestions } = useQuestionCollectionContext();

  const handleQuestionDownloads = async () => {
    if (!selectedQuestions.length) return;
    const requests = selectedQuestions.map((qId) =>
      QuestionAPI.downloadQuestion(qId)
    );
    const responses = await Promise.all(requests);
    responses.map((r) => downloadZip(r.blob, r.header));
    toast.success(
      selectedQuestions.length === 1
        ? "Question downloaded successfully."
        : `${selectedQuestions.length} questions downloaded successfully.`
    );
  };
  const handleDeleteQuestions = async () => {
    if (!selectedQuestions.length) return;
    const requests = selectedQuestions.map((qId) =>
      QuestionAPI.deleteQuestion(qId)
    );
    await Promise.all(requests);
    toast.success(
      selectedQuestions.length === 1
        ? "Question deleted successfully."
        : `${selectedQuestions.length} questions deleted successfully.`
    );
    window.location.reload();
  };
  const handleQuestionUpload = async (zipFile: File[]) => {
    try {
      await QuestionAPI.uploadQuestionZip(zipFile);
      toast.success("Question ZIP uploaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    }
  };
  return {
    handleDeleteQuestions,
    handleQuestionUpload,
    handleQuestionDownloads,
  };
}
