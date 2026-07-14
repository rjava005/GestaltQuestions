export const extensionToMime: Record<string, string> = {
  html: "text/html",
  js: "application/javascript",
  ts: "application/typescript",
  py: "text/x-python",
  json: "application/json",
  md: "text/markdown",
};

export const toEditorLanguage = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "html";
  const languageMap: Record<string, string> = {
    py: "python",
    python: "python",
    js: "javascript",
    javascript: "javascript",
    ts: "typescript",
    json: "json",
    html: "html",
    md: "markdown",
  };
  return languageMap[ext] ?? "plaintext";
};
