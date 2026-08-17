import { describe, expect, it } from "vitest";
import { evaluateAbstraction } from "./abstraction";

describe("abstraction graph", () => {
  it("creates a closed loop from policy through trace refresh", () => {
    const result = evaluateAbstraction({ contextBudget: 640, quantizedBits: 4, allowedTools: ["test_runner"], traceCoverage: 0.98, verifierCoverage: 0.96 });
    expect(result.edges.some(edge => edge.from === "trace" && edge.to === "memory")).toBe(true);
    expect(result.hardInvariants.budgetConserved).toBe(true);
  });
});
