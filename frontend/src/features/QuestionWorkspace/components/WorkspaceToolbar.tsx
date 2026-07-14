import type { QuestionRuntimeLanguage } from "../../../services/QuestionRuntime";
import { useQuestionWorkspaceStore } from "../instance/store";
import { ActivePanesToggle } from "./ActivePanesToggle";
import { LayoutToggle } from "./LayoutToggle";
import { RuntimeToggle } from "./RuntimeToggle";

type WorkspaceToolbarProps = {
  runtimeLanguages: QuestionRuntimeLanguage[];
};

export function WorkspaceToolbar({ runtimeLanguages }: WorkspaceToolbarProps) {
  const layoutMode = useQuestionWorkspaceStore((s) => s.layoutMode);
  const setLayoutMode = useQuestionWorkspaceStore((s) => s.setLayoutMode);
  const selectedRuntimeLanguage = useQuestionWorkspaceStore(
    (s) => s.selectedRuntimeLanguage,
  );
  const setSelectedRuntimeLanguage = useQuestionWorkspaceStore(
    (s) => s.setSelectedRuntimeLanguage,
  );
  const activePanes = useQuestionWorkspaceStore((s) => s.activePanes);
  const togglePane = useQuestionWorkspaceStore((s) => s.togglePane);
  const showSinglePane = useQuestionWorkspaceStore((s) => s.showSinglePane);

  const visiblePaneSelection =
    layoutMode === "single" ? [activePanes[0] ?? "livePreview"] : activePanes;

  return (
    <section className="flex flex-wrap items-center gap-4 border-b border-border bg-surface px-4 py-3">
      <LayoutToggle value={layoutMode} onChange={setLayoutMode} />
      <RuntimeToggle
        value={selectedRuntimeLanguage}
        options={runtimeLanguages}
        onChange={setSelectedRuntimeLanguage}
      />
      <ActivePanesToggle
        activePanes={visiblePaneSelection}
        onTogglePane={layoutMode === "single" ? showSinglePane : togglePane}
      />
    </section>
  );
}
