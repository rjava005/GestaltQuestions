import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { QuestionRunResponse } from "../../../services";
import { QuestionInstanceProvider } from "../instance";
import QuestionRenderShell from "./QuestionRenderShell";

vi.mock("../render/QuestionHtmlToReact", () => ({
  default: ({ html }: { html: string }) => (
    <div data-testid="rendered-html" data-html={html} />
  ),
}));

afterEach(cleanup);

describe("QuestionRenderShell", () => {
  it("explains when a secure solution is still locked", () => {
    const payload = {
      instance: "instance-1",
      qmeta: { id: "question-1", title: "Secure question" } as never,
      question_html: "<p>Question stem</p>",
      solution_html: null,
      logs: [],
      quiz_data: { params: {}, secure_grading: true },
    } as QuestionRunResponse;

    render(
      <QuestionInstanceProvider
        initialState={{
          ...payload,
          showSolution: true,
        }}
      >
        <QuestionRenderShell qpayload={payload} />
      </QuestionInstanceProvider>,
    );

    const renderedHtml = screen.getAllByTestId("rendered-html");
    expect(renderedHtml[1]).toHaveAttribute(
      "data-html",
      "Submit an answer to unlock the solution.",
    );
  });

  it("reveals a secure solution returned after grading", () => {
    const payload = {
      instance: "instance-1",
      qmeta: { id: "question-1", title: "Secure question" } as never,
      question_html: "<p>Question stem</p>",
      solution_html: null,
      logs: [],
      quiz_data: { params: {}, secure_grading: true },
    } as QuestionRunResponse;

    render(
      <QuestionInstanceProvider
        initialState={{
          ...payload,
          showSolution: true,
          solution_html: "<p>Private graded solution</p>",
        }}
      >
        <QuestionRenderShell qpayload={payload} />
      </QuestionInstanceProvider>,
    );

    const renderedHtml = screen.getAllByTestId("rendered-html");
    expect(renderedHtml[1]).toHaveAttribute(
      "data-html",
      "<p>Private graded solution</p>",
    );
    expect(renderedHtml[1]).not.toHaveAttribute(
      "data-html",
      "No Solution Available for Question",
    );
  });
});
