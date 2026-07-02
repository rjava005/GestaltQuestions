import type {
  AIMessageBubbleProps,
  ChatBubbleRender,
  ChatType,
  HumanBubbleProps,
  ToolBubbleProps,
} from "../instance/types";
import { normalizeContent } from "../utils/parsingUtils";
import { cleanChildren } from "../utils/utils";
import Markdown from "./MarkdownRender";

const ChatBubbleBase =
  "my-2 max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-soft";

const ChatBubbleStyles: Record<ChatType, string> = {
  ai: `${ChatBubbleBase} self-start border border-border bg-surface text-text`,
  human: `${ChatBubbleBase} self-end border border-border-strong bg-surface-strong text-text`,
  tool: `${ChatBubbleBase} self-start border border-accent/35 bg-surface-muted text-text`,
};

function formatArgs(args: unknown): string {
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args ?? "");
  }
}

function renderBubbleContent(model: ChatBubbleRender) {
  if (model.bubble === "ai") {
    const hasToolCalls = !!model.msg.tool_calls?.length;

    if (hasToolCalls && model.showTools !== false) {
      return (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-text-soft">
            Tool calls
          </div>
          {model.msg.tool_calls!.map((toolCall, index) => (
            <details
              key={`${toolCall.name}-${index}`}
              className="rounded-md border border-border bg-surface-muted p-2"
            >
              <summary className="cursor-pointer text-sm font-medium text-text">
                {toolCall.name}
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-code p-2 text-xs text-text-muted">
                {formatArgs(toolCall.args)}
              </pre>
            </details>
          ))}
        </div>
      );
    }
    return cleanChildren(normalizeContent(model.msg.content));
  }

  if (model.bubble === "tool") {
    return (
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-accent">
          Tool response
        </div>
        <div className="font-medium">{model.msg.name ?? "unknown_tool"}</div>
        <div>{cleanChildren(normalizeContent(model.msg.content))}</div>
      </div>
    );
  }

  return cleanChildren(normalizeContent(model.msg.content));
}

export function HumanBubble({ msg, type = "human" }: HumanBubbleProps) {
  return (
    <div className={ChatBubbleStyles[type]}>
      <Markdown>{renderBubbleContent({ bubble: "human", msg })}</Markdown>
    </div>
  );
}

export function AIBubble({
  msg,
  type = "ai",
  showTools = true,
}: AIMessageBubbleProps) {
  return (
    <div className={ChatBubbleStyles[type]}>
      <Markdown>
        {renderBubbleContent({ bubble: "ai", msg, showTools })}
      </Markdown>
    </div>
  );
}

export function ToolMessageBubble({ msg, type = "tool" }: ToolBubbleProps) {
  return (
    <div className={ChatBubbleStyles[type]}>
      {renderBubbleContent({ bubble: "tool", msg })}
    </div>
  );
}
