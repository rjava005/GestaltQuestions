import type React from "react";
import type { IconType } from "react-icons";
import { FiFileText, FiTarget } from "react-icons/fi";

import type { QuestionRunResponse } from "../../../services";
import type { QuestionRead } from "../../QuestionBuilder";
import { useQuestionInstance } from "../instance";
import QuestionHTMLToReact from "../render/QuestionHtmlToReact";
import QuestionActions from "./QuestionActions";
import DisplayAnswers from "./QuestionFeedback";

type QuestionHeaderProps = {
  qdata: QuestionRead | null | undefined;
  topicIcon?: IconType | null;
};

function MetadataChip({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: IconType | null;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm font-medium text-text-muted">
      {Icon ? <Icon className="h-4 w-4 text-accent" /> : null}
      {children}
    </span>
  );
}

function QuestionHeader({
  qdata,
  topicIcon: TopicIcon = null,
}: QuestionHeaderProps) {
  return (
    <header className="mb-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[rgba(57,91,255,0.18)] text-accent">
          <FiTarget className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-semibold text-text">
          {qdata?.title ?? "Untitled question"}
        </h1>
      </div>

      {qdata?.topics?.length ? (
        <div className="flex flex-wrap gap-2">
          {qdata.topics.map((topic) => (
            <MetadataChip
              key={topic}
              // TopicIcon is intentionally optional until topic-specific icons exist.
              icon={TopicIcon}
            >
              {topic}
            </MetadataChip>
          ))}
        </div>
      ) : null}

      {qdata?.qType?.length ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <FiFileText className="h-4 w-4 text-accent" />
          <span className="font-semibold text-text">Question Type:</span>
          {qdata.qType.map((qType) => (
            <MetadataChip key={qType}>{qType}</MetadataChip>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export default function QuestionBody({
  qpayload,
}: {
  qpayload: QuestionRunResponse;
}) {
  const hasSubmitted = useQuestionInstance((s) => s.hasSubmitted);
  const answers = useQuestionInstance((s) => s.answers);

  return (
    <div>
      <QuestionHeader qdata={qpayload.qmeta} />
      <QuestionHTMLToReact html={qpayload.question_html} />
      <QuestionActions />

      {hasSubmitted && qpayload.quiz_data && (
        <DisplayAnswers
          quizData={qpayload.quiz_data}
          submittedAnswer={answers}
        />
      )}
    </div>
  );
}
