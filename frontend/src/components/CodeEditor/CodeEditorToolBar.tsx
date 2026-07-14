import clsx from "clsx";

import { type EditorThemeKey } from "./types";
type TooBarProps = {
  language: string;
  theme: EditorThemeKey;
  setEditorTheme: (val: EditorThemeKey) => void;
};

export default function CodeEditorToolBar({
  language,
  theme,
  setEditorTheme,
}: TooBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-strong px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-soft">
        Editor: {language}
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="editor-theme-toggle"
          className="text-xs font-medium text-text-muted"
        >
          Theme
        </label>
        <select
          id="editor-theme-toggle"
          value={theme}
          onChange={(e) => setEditorTheme(e.target.value as EditorThemeKey)}
          className={clsx(
            "rounded-md border border-border",
            "bg-surface-strong px-2 py-1 text-xs",
            "text-text",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
          )}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="highContrast">High Contrast</option>
        </select>
      </div>
    </div>
  );
}
