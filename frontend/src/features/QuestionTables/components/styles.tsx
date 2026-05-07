export const styles = {
    shell: "mt-8 w-full",
    tableWrap:
        "overflow-hidden rounded-xl border border-border bg-surface shadow-soft backdrop-blur-md",
    scroll: "w-full overflow-x-auto",
    table: "min-w-full border-collapse",
    headRow: "bg-surface-strong",
    headCell:
        "border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted",
    bodyRow:
        "border-b border-border/70 last:border-b-0 hover:bg-surface-muted/60",
    bodyCell: "px-4 py-3 text-sm text-text",
    titleCell: "cursor-pointer font-medium text-text hover:text-accent",
    checkbox: "h-4 w-4 accent-[var(--color-accent)]",
    emptyCell: "px-4 py-8 text-center text-sm text-text-muted",
    footer:
        "mt-3 flex items-center justify-between gap-3 text-sm text-text-muted",
    pagerControls: "flex items-center gap-2",
    select:
        "rounded-md border border-border bg-surface px-2 py-1 text-sm text-text outline-none focus:border-accent",
    button:
        "rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
};