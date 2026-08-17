import { describe, expect, it } from "vitest";
import { toParetoData } from "./pareto";

describe("toParetoData", () => {
  it("maps attachment quality and context into a chart-ready candidate", () => {
    const result = toParetoData([{ name: "security.lmty", quality: 0.91, tokens: 640, complexity: 3.2, reliability: 0.94 }]);
    expect(result).toEqual([{ name: "security.lmty", quality: 91, tokens: 640, complexity: 3.2, reliability: 0.94 }]);
  });
});
