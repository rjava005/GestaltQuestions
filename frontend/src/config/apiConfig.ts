const questionURLRaw = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const aiURLRaw = import.meta.env.VITE_AI_URL;

function PrepareURL(raw: string | undefined | null, id?: string | null) {
  if (!raw) {
    throw new Error(`Failed to load url ${id}`);
  }
  return raw.startsWith("http")
    ? raw.replace(/\/$/, "")
    : `https://${raw.replace(/\/$/, "")}`;
}

export const questionAPIURL = PrepareURL(questionURLRaw, "backend");
export const aiURL = PrepareURL(aiURLRaw, "ai");
