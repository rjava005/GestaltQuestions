export type MODEL_INFO = {
  provider: string;
  value: string;
  label: string;
  active: boolean;
};
const ALL_MODELS: Partial<MODEL_INFO>[] = [
  {
    provider: "google_genai",
    value: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
  },
  {
    provider: "google_genai",
    value: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    active: true,
  },
  {
    provider: "google_genai",
    value: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
  },
  {
    provider: "google_genai",
    value: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
  },
] as const;

function createModelInfo(info: Partial<MODEL_INFO> = {}): MODEL_INFO {
  return {
    provider: "",
    value: "",
    label: "",
    active: false,
    ...info,
  };
}

export const CHAT_MODELS = ALL_MODELS.map((v) => createModelInfo(v));

export type ChatModel = (typeof CHAT_MODELS)[number]["value"];
export type ChatModelProvider = (typeof CHAT_MODELS)[number]["provider"];

export const DEFAULT_CHAT_MODEL: ChatModel = "gemini-2.5-flash";
