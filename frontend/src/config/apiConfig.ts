function withLocalDefault(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

const questionURLRaw = withLocalDefault(
  import.meta.env.VITE_API_URL,
  "http://localhost:8000",
);
const aiURLRaw = withLocalDefault(
  import.meta.env.VITE_AI_URL,
  "http://localhost:2024",
);

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
