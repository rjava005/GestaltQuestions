export const QUESTION_STATUS_VALUES = [
  "archived",
  "draft",
  "published",
] as const;

export type QuestionStatus = (typeof QUESTION_STATUS_VALUES)[number];

export const QUESTION_STATUS_OPTIONS: {
  label: string;
  value: QuestionStatus;
}[] = [
  { label: "Archived", value: "archived" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

export function isQuestionStatus(value: string): value is QuestionStatus {
  return QUESTION_STATUS_VALUES.includes(value as QuestionStatus);
}

export function normalizeQuestionStatus(value: string | null | undefined) {
  const normalized = value?.toLowerCase() ?? "";
  return isQuestionStatus(normalized) ? normalized : "draft";
}
export const QUESTION_TYPE_VALUES = [
  "MC",
  "MCQ",
  "MA",
  "TF",
  "FB",
  "NUM",
] as const;

export type QuestionType = (typeof QUESTION_TYPE_VALUES)[number];

export const QUESTION_TYPE_OPTIONS: {
  label: string;
  value: QuestionType;
}[] = [
  { label: "Multiple Choice", value: "MC" },
  { label: "Multiple Choice Question", value: "MCQ" },
  { label: "Multiple Answer", value: "MA" },
  { label: "True / False", value: "TF" },
  { label: "Fill in the Blank", value: "FB" },
  { label: "Numerical", value: "NUM" },
];

export function isQuestionType(value: string): value is QuestionType {
  return QUESTION_TYPE_VALUES.includes(value as QuestionType);
}

export function normalizeQuestionTypes(
  values: readonly string[],
): QuestionType[] {
  return values.filter(isQuestionType);
}

export type QuestionRead = {
  id: string;
  title: string | null;
  ai_generated: boolean;
  isAdaptive: boolean;
  storage_path: string | null;
  storage_type: string;
  status: QuestionStatus;
  created_by_id: string | null;
  topics: string[];
  qType: QuestionType[];
};

export type QuestionAllRow = {
  title: string;
  question_id: string;
  isAdaptive: boolean;
  ai_generated: boolean;
  status: QuestionStatus;
  user_id: string;
  created_by: string;
  institution: string;
};

export type QuestionCreate = {
  id?: string | null;
  title: string;
  ai_generated?: boolean;
  isAdaptive?: boolean;
  topics?: string[];
  qType?: QuestionType[];
  qTypes?: QuestionType[];
};

export type QuestionUpdate = {
  title?: string;
  ai_generated?: boolean;
  isAdaptive?: boolean;
  topics?: string[];
  qType?: QuestionType[];
  status?: QuestionStatus;
};

export type QuestionFilter = {
  title?: string;
  status: QuestionStatus;
};

export type QuestionFileList = string[];
export type QuestionDeleteResponse = boolean;
