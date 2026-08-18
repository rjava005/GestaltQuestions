import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import type { QuestionRunResponse } from "../../../services";
import { useQuestionInstance } from "../instance";
import QuestionBody from "../question/QuestionBody";
import QuestionHTMLToReact from "../render/QuestionHtmlToReact";
import QuestionPanel from "./QuestionPanel";
import SolutionPanel from "./SolutionPanel";

type QuestionRenderShellProps = {
  qpayload: QuestionRunResponse;
};

export default function QuestionRenderShell({
  qpayload,
}: QuestionRenderShellProps) {
  const showSolution = useQuestionInstance((s) => s.showSolution);
  const solutionHtml = useQuestionInstance((s) => s.solution_html);
  const secureGrading = useQuestionInstance(
    (s) => s.quiz_data?.secure_grading === true,
  );
  const grading = useQuestionInstance((s) => s.grading);
  const unavailableSolutionMessage =
    secureGrading && !grading
      ? "Submit an answer to unlock the solution."
      : "No Solution Available for Question";

  return (
    <PanelGroup direction="horizontal" className="min-h-[520px] w-full gap-3">
      <Panel
        order={1}
        defaultSize={showSolution ? 58 : 100}
        minSize={35}
        className="min-w-0"
      >
        <QuestionPanel>
          <QuestionBody qpayload={qpayload} />
        </QuestionPanel>
      </Panel>

      {showSolution && (
        <>
          <PanelResizeHandle className="w-2 rounded-[var(--radius-md)] bg-[var(--color-border)] transition-colors hover:bg-[var(--color-border-strong)]" />
          <Panel order={2} defaultSize={42} minSize={25} className="min-w-0">
            <SolutionPanel>
              <QuestionHTMLToReact
                html={solutionHtml ?? unavailableSolutionMessage}
              />
            </SolutionPanel>
          </Panel>
        </>
      )}
    </PanelGroup>
  );
}
