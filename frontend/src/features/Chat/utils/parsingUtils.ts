import type { CleanableContent } from "../instance/types";
import type { ContentBlock, ToolMessage } from "langchain";

export function normalizeContent(content: unknown): CleanableContent {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content as ContentBlock[];
  return String(content ?? "");
}

export function extractToolPayload(msg: ToolMessage): unknown {
  const c = msg.content;
  const cleaned = normalizeContent(c);
  let text: string | null = null;

  try {
    if (Array.isArray(cleaned)) {
      text = cleaned
        .map((b: any) => (typeof b?.text === "string" ? b.text : ""))
        .join("")
        .trim();
    } else if (typeof cleaned === "string") {
      text = cleaned;
    }

    if (!text) return c;
    return JSON.parse(text);
  } catch {
    return c;
  }
}
