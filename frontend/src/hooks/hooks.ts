import { useEffect } from "react";

export function useOnClickOutside<T extends HTMLDivElement>(
  ref: React.RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  if (ref === null) return;
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// import { useQuestionCollectionContext } from "./../context/QuestionCollectionContext";
// import { QuestionAPI } from "../services";
// import { downloadZip } from "../utils/downloadUtils";
// import { toast } from "react-toastify";

// export function useDownloadQuestion() {
//   const { selectedQuestions } = useQuestionCollectionContext();

//   const handleQuestionDownloads = async () => {
//     try {
//       const requests = selectedQuestions.map((qId) =>
//         QuestionAPI.downloadQuestion(qId),
//       );
//       const responses = await Promise.all(requests);
//       responses.forEach((r) => downloadZip(r.blob, r.header));
//       toast.success(
//         selectedQuestions.length === 1
//           ? "Question downloaded successfully."
//           : `${selectedQuestions.length} questions downloaded successfully.`,
//       );
//     } catch (error) {
//       console.error("Failed to download question(s):", error);
//       toast.error(
//         selectedQuestions.length === 1
//           ? "Failed to download question."
//           : "Failed to download one or more questions.",
//       );
//     }
//   };

//   return { handleQuestionDownloads };
// }

// import { QuestionAPI } from "../services";
// import { toast } from "react-toastify";
// import { isAxiosError } from "axios";

// export function useUploadQuestion() {
//   const handleQuestionUpload = async (zipFile: File[]) => {
//     if (!zipFile.length) {
//       toast.error("Please select a ZIP file to upload.");
//       return;
//     }

//     if (zipFile.length > 1) {
//       toast.error("Please upload exactly one ZIP file.");
//       return;
//     }

//     const [file] = zipFile;
//     if (!file.name.toLowerCase().endsWith(".zip")) {
//       toast.error("Invalid file type. Please upload a .zip file.");
//       return;
//     }

//     try {
//       await QuestionAPI.uploadQuestionZip(zipFile);
//       toast.success("Question ZIP uploaded successfully.");
//     } catch (error) {
//       console.error(error);

//       if (isAxiosError(error)) {
//         const responseData = error.response?.data as
//           | string
//           | { detail?: string; message?: string }
//           | undefined;
//         const message =
//           (typeof responseData === "string" && responseData) ||
//           (typeof responseData === "object" &&
//             (responseData.detail || responseData.message)) ||
//           error.message;
//         toast.error(message || "Upload failed. Please try again.");
//         return;
//       }

//       if (error instanceof Error && error.message) {
//         toast.error(error.message);
//         return;
//       }

//       toast.error("Upload failed. Please try again.");
//     }
//   };

//   return { handleQuestionUpload };
// }
