// Universal panel sizes
export type UIPanelSize = "xs" | "sm" | "md" | "lg" | "xl";

// Universal panel style variants
export type UIPanelVariant = "default" | "minimal" | "soft" | "elevated";

export const uiPanelVariantStyles: Record<UIPanelVariant, string> = {
  default: "border border-gray-300 shadow-sm bg-white",

  minimal: "border border-gray-200 bg-gray-50 hover:bg-gray-100",

  soft: "bg-gray-100 border border-gray-200 rounded-xl shadow-inner",

  elevated: "bg-white border border-gray-200 shadow-lg rounded-xl",
};


export const uiPanelSizeStyles: Record<UIPanelSize, string> = {
    xs: "p-2 min-w-[150px] min-h-[150px] md:min-w-[180px] md:min-h-[180px]",

    sm: "p-3 min-w-[220px] min-h-[220px] md:min-w-[260px] md:min-h-[260px]",

    md: "p-4 min-w-[300px] min-h-[400px] md:min-w-[350px] md:min-h-[450px]",

    lg: "p-6 min-w-[400px] min-h-[500px] md:min-w-[500px] md:min-h-[600px]",

    xl: "p-8 min-w-[550px] min-h-[650px] md:min-w-[650px] md:min-h-[750px]",
};