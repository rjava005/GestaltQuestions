import { describe, expect, it } from "vitest";

import { createQuestionInstanceStore } from "./stores";

describe("question variant regeneration context", () => {
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
});
