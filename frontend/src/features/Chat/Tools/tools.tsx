import type { ToolDefinition, ToolName } from "../instance/types";
import {
  parseQuestionPayload,
  QuestionReviewCard,
  submitFinalQuestionPayload,
} from "./finalQuestionPayloadTools";

export const tools: Partial<Record<ToolName, ToolDefinition<any>>> = {
  final_question_payload: {
    parse: parseQuestionPayload,
    Preview: QuestionReviewCard,
    execute: submitFinalQuestionPayload,
  },
};
