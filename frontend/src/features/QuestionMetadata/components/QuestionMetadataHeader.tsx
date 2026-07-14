import { Tag } from "lucide-react";

export function QuestionMetadataHeader() {
  return (
    <header className="border-b border-border pb-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
          <Tag className="h-7 w-7 text-accent" aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-text">
            Question Metadata
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Manage publishing, classification, and behavior settings.
          </p>
        </div>
      </div>
    </header>
  );
}
