export type UIPanelSize = "xs" | "sm" | "md" | "lg" | "xl";
export type UIPanelVariant = "default" | "minimal" | "soft" | "elevated";

export const uiPanelBaseStyles =
  "rounded-[var(--radius-md)] border transition-all duration-[var(--duration-base)] ease-[var(--ease-base)] text-[var(--color-text)] border-[var(--color-border)]";

export const uiPanelVariantStyles: Record<UIPanelVariant, string> = {
  default: "bg-[var(--color-surface-strong)] shadow-[var(--shadow-soft)]",
  minimal: "bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)]",
  soft: "bg-[var(--color-surface)] shadow-inner",
  elevated:
    "bg-[var(--color-surface-strong)] border-[var(--color-border-strong)] shadow-[var(--shadow-soft)]",
};

export const uiPanelSizeStyles: Record<UIPanelSize, string> = {
  xs: "p-2 min-w-[150px] min-h-[150px] md:min-w-[180px] md:min-h-[180px]",
  sm: "p-3 min-w-[220px] min-h-[220px] md:min-w-[260px] md:min-h-[260px]",
  md: "p-4 min-w-[300px] min-h-[400px] md:min-w-[350px] md:min-h-[450px]",
  lg: "p-6 min-w-[400px] min-h-[500px] md:min-w-[500px] md:min-h-[600px]",
  xl: "p-8 min-w-[550px] min-h-[650px] md:min-w-[650px] md:min-h-[750px]",
};

export const uiTextStyles = {
  title: "text-[var(--color-text)] font-semibold",
  subtitle: "text-[var(--color-text-muted)]",
  helper: "text-[var(--color-text-soft)]",
};

export const uiInputStyles = {
  base: "w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]",
  fieldset:
    "border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-md)] p-4 mb-4",
};

export const uiChoiceStyles = {
  label: "text-sm font-medium text-[var(--color-text-muted)]",
  option:
    "flex items-center gap-2 cursor-pointer rounded-[var(--radius-md)] px-2 py-1 hover:bg-[var(--color-surface-muted)]",
  optionCorrect: "text-[var(--color-accent-strong)]",
  optionIncorrect: "text-[var(--color-text-soft)]",
  checkbox: "accent-[var(--color-accent)]",
};
