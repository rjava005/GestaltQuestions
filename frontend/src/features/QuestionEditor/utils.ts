const languageMap: Record<string, string> = {
  js: "javascript",
  py: "python",
  json: "json",
  html: "html",
};

export const resolveLanguage = (file: string) => {
  const ext = file.split(".").pop() ?? "";
  return languageMap[ext] ?? "plaintext";
};
