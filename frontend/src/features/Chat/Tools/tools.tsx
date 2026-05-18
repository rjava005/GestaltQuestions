import type { ToolName, ToolDefinition } from "../instance/types";

import { submitFinalQuestionPayload, QuestionReviewCard, parseQuestionPayload } from "./finalQuestionPayloadTools";


export const tools: Partial<Record<ToolName, ToolDefinition<any>>> = {
    final_question_payload: {
        parse: parseQuestionPayload,
        Preview: QuestionReviewCard,
        execute: submitFinalQuestionPayload,
    },


}
