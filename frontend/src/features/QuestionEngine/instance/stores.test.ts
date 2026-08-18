import { afterEach, describe, expect, it, vi } from "vitest";

import { QuestionRuntimeApi } from "../../../services/QuestionRuntime";
import { createQuestionInstanceStore } from "./stores";

describe("question variant regeneration context", () => {
  afterEach(() => vi.restoreAllMocks());
  it("captures the active circuit variant only when regeneration is requested", () => {
    const store = createQuestionInstanceStore({
      quiz_data: {
        params: { circuitVariant: "lowPass" },
        correct_answers: {},
      },
    });

    expect(store.getState().previousCircuitVariant).toBeUndefined();
    store.getState().setRefreshKey();

    expect(store.getState().refreshKey).toBe(1);
    expect(store.getState().previousCircuitVariant).toBe("lowPass");
  });

  it("submits secure answers to the opaque instance and stores per-slot results", async () => {
    const grade = vi
      .spyOn(QuestionRuntimeApi, "gradeQuestion")
      .mockResolvedValue({
        status: "correct",
        answers: { transfer: { status: "correct" } },
        solution_html: "<p>solution</p>",
      });
    const store = createQuestionInstanceStore({
      instance: "instance-1",
      qmeta: { id: "question-1" } as never,
      quiz_data: { params: {}, secure_grading: true, answer_specs: {} },
      answers: { transfer: { latex: "s", mathjson: "s" } },
    });

    await store.getState().submitAnswers();

    expect(grade).toHaveBeenCalledWith(
      "question-1",
      "instance-1",
      store.getState().answers,
    );
    expect(store.getState().grading?.status).toBe("correct");
    expect(store.getState().solution_html).toBe("<p>solution</p>");
    expect(store.getState().hasSubmitted).toBe(true);
  });

  it("keeps an incorrect secure answer editable for another submission", async () => {
    vi.spyOn(QuestionRuntimeApi, "gradeQuestion").mockResolvedValue({
      status: "incorrect",
      answers: { transfer: { status: "incorrect" } },
      solution_html: "<p>private solution</p>",
    });
    const store = createQuestionInstanceStore({
      instance: "instance-1",
      qmeta: { id: "question-1" } as never,
      quiz_data: { params: {}, secure_grading: true, answer_specs: {} },
      answers: { transfer: { latex: "s", mathjson: "s" } },
    });

    await store.getState().submitAnswers();

    expect(store.getState().grading?.status).toBe("incorrect");
    expect(store.getState().solution_html).toBe("<p>private solution</p>");
    expect(store.getState().hasSubmitted).toBe(false);
  });

  it("hides a previously open solution when loading a new variant", () => {
    const store = createQuestionInstanceStore({ showSolution: true });

    store.getState().setRunTimeContent({
      instance: "instance-2",
      qmeta: { id: "question-1" } as never,
      question_html: "<p>new question</p>",
      solution_html: null,
      logs: [],
      quiz_data: { params: {} },
    });

    expect(store.getState().showSolution).toBe(false);
  });
});
