import QuestionHTMLToReact from "../render/QuestionHtmlToReact";

export default function QuestionSolution({
  solutionHtml,
}: {
  solutionHtml: string | null;
}) {
  if (!solutionHtml || solutionHtml.trim().toLowerCase() === "none") {
    return <div>No solution available</div>;
  }

  return <QuestionHTMLToReact html={solutionHtml} />;
}
