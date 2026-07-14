import {
  normalizeQuestionStatus,
  normalizeQuestionTypes,
  QUESTION_STATUS_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  type QuestionRead,
  type QuestionStatus,
  type QuestionType,
} from "../../types/questionTypes";

export type QuestionMetadataFormValue = {
  title: string;
  status: QuestionStatus;
  ai_generated: boolean;
  isAdaptive: boolean;
  topics: string[];
  qType: QuestionType[];
};

export const emptyQuestionMetadata: QuestionMetadataFormValue = {
  title: "",
  status: "draft",
  ai_generated: false,
  isAdaptive: false,
  topics: [],
  qType: [],
};

export function toQuestionMetadataFormValue(
  question: QuestionRead | null | undefined,
): QuestionMetadataFormValue {
  if (!question) return emptyQuestionMetadata;

  return {
    title: question.title ?? "",
    status: normalizeQuestionStatus(question.status),
    ai_generated: Boolean(question.ai_generated),
    isAdaptive: Boolean(question.isAdaptive),
    topics: Array.isArray(question.topics) ? question.topics : [],
    qType: Array.isArray(question.qType)
      ? normalizeQuestionTypes(question.qType)
      : [],
  };
}

export function serializeQuestionMetadata(value: QuestionMetadataFormValue) {
  return {
    title: value.title.trim(),
    status: value.status,
    ai_generated: value.ai_generated,
    isAdaptive: value.isAdaptive,
    topics: value.topics,
    qType: value.qType,
  };
}

export function metadataValuesEqual(
  left: QuestionMetadataFormValue,
  right: QuestionMetadataFormValue,
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function normalizeTopicLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseTopicInput(value: string) {
  return value.split(",").map(normalizeTopicLabel).filter(Boolean);
}

export function getStatusLabel(status: QuestionStatus) {
  return (
    QUESTION_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

export function getQuestionTypeLabel(qType: QuestionType) {
  return (
    QUESTION_TYPE_OPTIONS.find((option) => option.value === qType)?.label ??
    qType
  );
}

export function getStatusDescription(status: QuestionStatus) {
  if (status === "published") {
    return "Published questions are visible to everyone.";
  }

  if (status === "archived") {
    return "Archived questions are hidden from active workflows.";
  }

  return "Draft questions are personal and only visible to you.";
}
