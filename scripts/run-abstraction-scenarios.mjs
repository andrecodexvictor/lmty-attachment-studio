import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const scenarios = [
  { name: "constrained", budget: 384, bits: 4, tools: "filesystem,test_runner" },
  { name: "balanced", budget: 640, bits: 4, tools: "filesystem,test_runner,typecheck" },
  { name: "long-context", budget: 1024, bits: 8, tools: "filesystem,test_runner,typecheck,visual_verify" },
];

const results = scenarios.map(scenario => {
  const output = execFileSync("node", ["scripts/lmty-abstraction-cli.mjs", "diagnose", "--budget", String(scenario.budget), "--bits", String(scenario.bits), "--tools", scenario.tools], { encoding: "utf8" });
  return { ...scenario, result: JSON.parse(output) };
});

const satisfied = results.filter(item => item.result.satisfied);
const report = { generatedAt: new Date().toISOString(), criteria: "score >= 0.90 with hard invariants true", total: results.length, satisfied: satisfied.length, results };
mkdirSync("reports", { recursive: true });
writeFileSync("reports/abstraction_scenarios.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
