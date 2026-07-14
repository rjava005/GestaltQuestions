export const languageMap: Record<string, string> = {
  py: "python",
  python: "python",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  json: "json",
  html: "html",
  md: "markdown",
  markdown: "markdown",
};

export const editorThemeOptions = {
  light: "vs",
  dark: "vs-dark",
  highContrast: "hc-black",
} as const;

export type EditorThemeKey = keyof typeof editorThemeOptions;
