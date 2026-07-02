export type RowProps = {
  label: string;
  value: React.ReactNode;
};

export function MetadataRow({ label, value }: RowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-border last:border-b-0">
      <div className="text-text-muted text-sm">{label}</div>
      <div className="text-text text-sm">{value}</div>
    </div>
  );
}
