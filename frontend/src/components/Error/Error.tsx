type ErrorVariant = "general" | "codeExecution";

type ErrorProps = {
  error: string;
  variant?: ErrorVariant;
};

const variantConfig: Record<
  ErrorVariant,
  { title: string; toneClassName: string }
> = {
  general: {
    title: "Error",
    toneClassName:
      "border-red-300/80 dark:border-red-600 bg-red-50/80 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  },
  codeExecution: {
    title: "Code Execution Error",
    toneClassName:
      "border-amber-300/80 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
  },
};

const Error = ({ error, variant = "general" }: ErrorProps) => {
  const { title, toneClassName } = variantConfig[variant];

  return (
    <div className="w-full h-full mx-auto my-8 px-4">
      <div
        className={`flex items-center gap-3 border font-medium p-4 ${toneClassName}`}
        style={{
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <span>
          <strong>{title}:</strong> {error}
        </span>
      </div>
    </div>
  );
};

export default Error;
