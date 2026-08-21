import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validateBlockDiagramDefinition } from "./blockDiagramDefinition";
import { validateSignalPlotDefinition } from "./signalPlotDefinition";

/**
 * The checked-in question bundles are imported at backend startup and rendered
 * by these validators. A bundle whose JSON no longer validates would only fail
 * at request time, so assert it here instead -- this also covers the
 * SchemDraw-generated geometry in framework_schemdraw_demo.
 */
const QUESTIONS_DIR = join(process.cwd(), "..", "backend", "questions");

function bundlesWith(filename: string): Array<[string, unknown]> {
  return readdirSync(QUESTIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const path = join(QUESTIONS_DIR, entry.name, filename);
      try {
        return [[entry.name, JSON.parse(readFileSync(path, "utf-8"))]] as Array<
          [string, unknown]
        >;
      } catch {
        return [];
      }
    });
}

describe("shipped question visual definitions", () => {
  it("validates every block-diagram.json in backend/questions", () => {
    const bundles = bundlesWith("block-diagram.json");
    expect(bundles.length).toBeGreaterThan(0);
    for (const [name, definition] of bundles) {
      expect(() => validateBlockDiagramDefinition(definition), name).not.toThrow();
    }
  });

  it("validates every signal-plot.json in backend/questions", () => {
    for (const [name, definition] of bundlesWith("signal-plot.json")) {
      expect(() => validateSignalPlotDefinition(definition), name).not.toThrow();
    }
  });

  it("keeps generated wire endpoints attached to the blocks they connect", () => {
    const [, raw] = bundlesWith("block-diagram.json").find(
      ([name]) => name === "framework_schemdraw_demo",
    )!;
    const definition = validateBlockDiagramDefinition(raw);

    const portsByNode = new Map<string, string[]>();
    for (const node of definition.nodes) {
      const [x, y] = node.at;
      const halfWidth = Math.floor((node.width ?? 0) / 2);
      const halfHeight = Math.floor((node.height ?? 0) / 2);
      const own: string[] = [];
      if (halfWidth) own.push(`${x - halfWidth},${y}`, `${x + halfWidth},${y}`);
      if (halfHeight) own.push(`${x},${y - halfHeight}`, `${x},${y + halfHeight}`);
      if (!halfWidth && !halfHeight) own.push(`${x},${y}`);
      portsByNode.set(node.id, own);
    }
    const ports = new Set([...portsByNode.values()].flat());

    // Each block port the loop routes through is actually landed on. Free ends
    // (the R(s) input and Y(s) output) and corner-to-corner routing segments are
    // legitimate, so this checks the ports rather than every endpoint.
    const endpoints = definition.wires.flatMap((wire) => [
      wire.points[0],
      wire.points[wire.points.length - 1],
    ]);
    const landed = new Set(endpoints.map(([x, y]) => `${x},${y}`));
    for (const [id, own] of portsByNode) {
      expect(
        own.some((port) => landed.has(port)),
        `block ${id} has no wire attached to any of its ports`,
      ).toBe(true);
    }

    // The failure this guards against is subtler than a missing connection: a
    // wire ending one grid step short of its block still looks routed in the
    // JSON but renders as a visible gap. Every endpoint must sit exactly on a
    // port or clearly away from it, never just beside it.
    const parsedPorts = [...ports].map((port) => port.split(",").map(Number));
    for (const [x, y] of endpoints) {
      for (const [px, py] of parsedPorts) {
        const distance = Math.hypot(px - x, py - y);
        expect(
          distance === 0 || distance > 10,
          `endpoint ${x},${y} sits ${distance} from port ${px},${py}`,
        ).toBe(true);
      }
    }
  });

  it("keeps every wire segment axis-aligned, in every shipped diagram", () => {
    // Every diagram in this repo is Manhattan-routed by convention -- no
    // diagonal wires -- so a segment that is neither horizontal nor vertical
    // is always a bug, not a stylistic choice. A wire's own polyline can
    // legitimately turn a corner (an L-shaped run across several points), so
    // this checks each *consecutive pair* of points, not the wire's overall
    // start-to-end direction.
    for (const [name, raw] of bundlesWith("block-diagram.json")) {
      const definition = validateBlockDiagramDefinition(raw);
      for (const wire of definition.wires) {
        for (let i = 0; i < wire.points.length - 1; i += 1) {
          const [x1, y1] = wire.points[i];
          const [x2, y2] = wire.points[i + 1];
          expect(
            x1 === x2 || y1 === y2,
            `${name}: segment [${x1},${y1}] -> [${x2},${y2}] is diagonal`,
          ).toBe(true);
        }
      }
    }
  });

  it("binds only parameters the runtime actually emits", () => {
    const [, raw] = bundlesWith("block-diagram.json").find(
      ([name]) => name === "framework_schemdraw_demo",
    )!;
    const definition = validateBlockDiagramDefinition(raw);
    const server = readFileSync(
      join(QUESTIONS_DIR, "framework_schemdraw_demo", "server.py"),
      "utf-8",
    );

    for (const node of definition.nodes) {
      const value = node.value;
      if (!value || !("path" in value)) continue;
      const name = value.path.replace(/^params\./, "");
      expect(server, `${node.id} binds params.${name}`).toContain(`"${name}"`);
    }
  });
});
