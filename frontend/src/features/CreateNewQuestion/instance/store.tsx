import { createStore } from "zustand";
import type { QuestionCreationState, QuestionCreationStore } from "./types";
import type { QuestionCreate } from "../../../types/questionTypes";

const initialState: QuestionCreationState = {
  defaultFiles: [],
  uploadedFiles: null,
  questionIsAdaptive: false,
  questionData: {
    title: "",
    topics: [],
    qTypes: [],
    isAdaptive: false,
    ai_generated: false,
  },
  fileDrafts: {},
};

export function createQuestionStore(preloaded?: Partial<QuestionCreationState>) {
  return createStore<QuestionCreationStore>()((set) => ({
    ...initialState,
    ...preloaded,
    setDefaultFiles: (files) => set({ defaultFiles: files }),
    addDefaultFile: (file) =>
      set((state) => ({
        defaultFiles: state.defaultFiles.includes(file)
          ? state.defaultFiles
          : [...state.defaultFiles, file],
      })),
    removeDefaultFile: (file) =>
      set((state) => ({
        defaultFiles: state.defaultFiles.filter((v) => v !== file),
      })),
    setUploadedFiles: (files) =>
      set((state) => ({ uploadedFiles: [...(state.uploadedFiles ?? []), ...files] })),
    removeUploadedFile: (file) =>
      set((state) => ({
        uploadedFiles: state.uploadedFiles?.filter((v) => v !== file),
      })),
    removeUploadedFileByIndex: (index: number) =>
      set((state) => ({
        uploadedFiles: state.uploadedFiles?.filter((_, i) => i !== index) ?? [],
      })),
    setIsAdaptive: (value) =>
      set((state) => ({
        questionIsAdaptive: value,
        questionData: {
          ...(state.questionData ?? { title: "" }),
          isAdaptive: value,
        } as QuestionCreate,
      })),
    setQuestionData: (payload) =>
      set((state) => {
        const nextQuestionData = {
          ...(state.questionData ?? {}),
          ...payload,
        } as QuestionCreate;

        return {
          questionData: nextQuestionData,
          questionIsAdaptive: nextQuestionData.isAdaptive ? true : false,
        };
      }),
    setFileDraft: (filename, content) =>
      set((state) => ({
        fileDrafts: {
          ...state.fileDrafts,
          [filename]: content,
        },
      })),
  }));
}
