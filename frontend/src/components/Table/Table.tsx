import clsx from "clsx";
export type TableProps = React.ComponentPropsWithoutRef<"table"> & {
  label?: string;
};

export default function Table({ label, className, ...props }: TableProps) {
  return (
    <table
      aria-label={label}
      className={clsx("min-w-full border-collapse", className)}
      {...props}
    />
  );
}
