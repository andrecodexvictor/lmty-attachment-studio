import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("lmty abstraction CLI", () => {
  it("reports a satisfied diagnostic and a graph feedback edge", () => {
    const output = execFileSync("node", ["scripts/lmty-abstraction-cli.mjs", "diagnose", "--budget", "640", "--bits", "4"], { encoding: "utf8" });
    const result = JSON.parse(output) as { satisfied: boolean; score: number; graph: { edges: { from: string; to: string }[] } };
    expect(result.satisfied).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.9);
    expect(result.graph.edges).toContainEqual({ from: "trace", to: "memory", label: "refresh" });
  });
});
