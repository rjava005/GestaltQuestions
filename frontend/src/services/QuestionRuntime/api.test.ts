import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../client";
import QuestionRuntimeApi from "./api";

vi.mock("../client", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("QuestionRuntimeApi.runQuestion", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.post).mockResolvedValue({ data: { instance: "one" } });
  });

  it("omits the body when no generation context is available", async () => {
    await QuestionRuntimeApi.runQuestion("q1", "python");

    expect(api.post).toHaveBeenCalledWith(
      "/questions/q1/runtimes/run?language=python",
      undefined,
    );
  });

  it("sends the previous circuit variant when provided", async () => {
    await QuestionRuntimeApi.runQuestion("q1", "javascript", "highPass");

    expect(api.post).toHaveBeenCalledWith(
      "/questions/q1/runtimes/run?language=javascript",
      { previousCircuitVariant: "highPass" },
    );
  });
});
