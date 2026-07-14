import type { QuestionRuntimeLanguage } from "../../../services/QuestionRuntime";

export type WorkspacePane = "livePreview" | "editor" | "metadata";
export type WorkspaceLayoutMode = "single" | "split";

export type QuestionWorkspaceState = {
  layoutMode: WorkspaceLayoutMode;
  activePanes: WorkspacePane[];
  selectedRuntimeLanguage: QuestionRuntimeLanguage | null;
  runtimeLanguages: QuestionRuntimeLanguage[];
};

export type QuestionWorkspaceActions = {
  setLayoutMode: (mode: WorkspaceLayoutMode) => void;
  setActivePanes: (panes: WorkspacePane[]) => void;
  togglePane: (pane: WorkspacePane) => void;
  showSinglePane: (pane: WorkspacePane) => void;
  setRuntimeLanguages: (languages: QuestionRuntimeLanguage[]) => void;
  setSelectedRuntimeLanguage: (language: QuestionRuntimeLanguage) => void;
};
