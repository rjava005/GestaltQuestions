type TableContainerProps = React.PropsWithChildren;

export function TableContainer({ children }: TableContainerProps) {
  return (
    <div className="w-full flex-1 ">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft backdrop-blur-md h-full">
        <div className="w-full overflow-x-auto h-full">{children}</div>
      </div>
    </div>
  );
}
