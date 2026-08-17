import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("lmty context CLI", () => {
  it("returns a bounded evidence window and a 4x compression estimate", () => {
    const output = execFileSync("node", ["scripts/lmty-context-cli.mjs", "--artifact", "frontend.lmty", "--bits", "4", "--budget", "640"], { encoding: "utf8" });
    const result = JSON.parse(output) as { artifact: string; compression: { estimatedRatio: number }; layers: { evidence: number }; usedTokens: number };
    expect(result.artifact).toBe("frontend.lmty");
    expect(result.compression.estimatedRatio).toBe(4);
    expect(result.usedTokens).toBeLessThanOrEqual(result.layers.evidence);
  });
});
