import type { QuestionRead } from "../../../../types/questionTypes";

export default function QuestionHeader({
  qdata,
}: {
  qdata: QuestionRead | null | undefined;
}) {
  return (
    <header className="mb-4 border-b border-border pb-3">
      <h1 className="mt-1 text-2xl font-semibold text-text">
        {qdata?.title ?? "Untitled question"}
      </h1>
      <span className="flex flex-row gap-2 items-center justify-baseline">
        Topics:{" "}
        {qdata?.topics?.length ? (
          <p className="mt-1 text-sm text-text-muted">
            {qdata.topics.join(", ")}
          </p>
        ) : null}
      </span>
      <span className="flex flex-row gap-2 items-center justify-baseline">
        Qtype:{" "}
        {qdata?.qTypes?.length ? (
          <p className="mt-1 text-sm text-text-muted">
            {qdata.qTypes.join(", ")}
          </p>
        ) : null}
      </span>
    </header>
  );
}
