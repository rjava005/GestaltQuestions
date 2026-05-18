import type { BaseMessage, ToolMessage } from "langchain";

export function isToolMessage(msg: BaseMessage): msg is ToolMessage {
  return (
    msg.type === "tool" &&
    typeof (msg as { tool_call_id?: unknown }).tool_call_id === "string"
  );
}
