import { describe, expect, it } from "vitest";
import { lmtyStore } from "./lmtyStore";

describe("lmtyStore", () => {
  it("compiles an artifact with the .lmty extension", () => {
    const attachment = lmtyStore.compile({ domain: "Security", contextBudget: 320, tools: ["filesystem"], qualityTarget: 0.9, datasetId: "data_frontend" });
    expect(attachment.name.endsWith(".lmty")).toBe(true);
    expect(attachment.contextBudget).toBe(320);
    expect(lmtyStore.snapshot().candidates.some(candidate => candidate.attachmentId === attachment.id)).toBe(true);
  });

  it("preserves MAL state and emits a trace", () => {
    const session = lmtyStore.openSession("att_frontend", ["test_runner"]);
    const result = lmtyStore.runTask(session.id, "Corrigir bug de hydration");
    expect(result.session.stateCalls).toBe(1);
    expect(result.trace.route).toContain("reproduce");
  });

  it("selects high-value memory within the evidence context window", () => {
    const result = lmtyStore.optimizeContext(512, 4);
    expect(result.metrics.compressionRatio).toBe(4);
    expect(result.metrics.usedTokens).toBeLessThanOrEqual(result.metrics.evidenceBudget);
    expect(result.selected.length).toBeGreaterThan(0);
  });
});
