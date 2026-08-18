import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PLSolutionPanel from "./PLSolutionPanel";

vi.mock("better-react-mathjax", () => ({
  MathJax: ({ children }: { children: ReactNode }) => children,
}));

afterEach(cleanup);

describe("PLSolutionPanel", () => {
  it("shows a single solution step immediately", () => {
    render(
      <PLSolutionPanel>
        <p>The closed-loop gain is K/(K+2).</p>
      </PLSolutionPanel>,
    );

    expect(screen.getByText("The closed-loop gain is K/(K+2).")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
  });

  it("reveals additional steps and can reset to the first step", () => {
    render(
      <PLSolutionPanel>
        <p>First step</p>
        <p>Second step</p>
      </PLSolutionPanel>,
    );

    expect(screen.getByText("First step")).toBeVisible();
    expect(screen.queryByText("Second step")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show Next Step" }));
    expect(screen.getByText("Second step")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("First step")).toBeVisible();
    expect(screen.queryByText("Second step")).not.toBeInTheDocument();
  });
});
