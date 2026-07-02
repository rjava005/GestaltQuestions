import {
  AIMessage,
  HumanMessage,
  ToolMessageChunk,
} from "@langchain/core/messages";
import type { ContentBlock, ToolMessage } from "langchain";

// ------------------------
// TOOL Types
// ------------------------
export type ToolExecuteContext = {
  token?: string;
};

type ToolExecuteArgs<TPayload> = {
  payload: TPayload;
  ctx?: ToolExecuteContext;
};
export type ToolExecute<TPayload> = (
  args: ToolExecuteArgs<TPayload>,
) => Promise<void>;
// Tools that are specific and we want to render and get some sorth of output from
export type ToolName = "final_question_payload" | "generate_image";

export type RenderPreviewProps<TPayload> = {
  payload: TPayload;
  onApprove?: (payload: TPayload) => void;
  onCancel?: () => void;
  loading: boolean;
  error?: string;
};

export type ToolDefinition<TPayload> = {
  parse: (msg: ToolMessage) => TPayload;
  Preview: React.ComponentType<RenderPreviewProps<TPayload>>;
  execute: ToolExecute<TPayload>;
};

export type ToolDefinitions = Record<ToolName, ToolDefinition<any>>;

//----------------------
// Chat types
//----------------------
export type ChatType = "human" | "ai" | "tool";

export type ChatBubbleRender =
  | { bubble: "human"; msg: HumanMessage }
  | { bubble: "ai"; msg: AIMessage; showTools?: boolean }
  | { bubble: "tool"; msg: ToolMessageChunk };

export interface HumanBubbleProps {
  type?: "human";
  msg: HumanMessage;
}

export interface AIMessageBubbleProps {
  type?: "ai";
  msg: AIMessage;
  showTools?: boolean;
}

export interface ToolBubbleProps {
  type?: "tool";
  msg: ToolMessageChunk;
}

export type CleanableContent = ContentBlock[] | string;

// Payloads of interest

export type UnknownRecord = Record<string, unknown>;
