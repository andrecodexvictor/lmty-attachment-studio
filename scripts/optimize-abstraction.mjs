import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const budgets = [384, 512, 640, 768, 1024];
const bitWidths = [4, 8, 16];
const toolSets = ["filesystem,test_runner", "filesystem,test_runner,typecheck", "filesystem,test_runner,typecheck,visual_verify"];

function diagnose(budget, bits, tools) {
  const output = execFileSync("node", ["scripts/lmty-abstraction-cli.mjs", "diagnose", "--budget", String(budget), "--bits", String(bits), "--tools", tools], { encoding: "utf8" });
  return JSON.parse(output);
}

function rank(candidate) {
  const compression = 16 / candidate.bits;
  const compactness = 1 - (candidate.budget - 384) / (1024 - 384);
  return Number((0.55 * candidate.result.score + 0.3 * Math.min(1, compression / 4) + 0.15 * compactness).toFixed(3));
}

const trials = budgets.flatMap(budget => bitWidths.flatMap(bits => toolSets.map(tools => ({ budget, bits, tools, result: diagnose(budget, bits, tools) }))));
const accepted = trials.filter(trial => trial.result.satisfied).map(trial => ({ ...trial, objective: rank(trial) })).sort((left, right) => right.objective - left.objective);
const rejected = trials.filter(trial => !trial.result.satisfied);
const report = {
  generatedAt: new Date().toISOString(),
  objective: "maximize structural score, compression adequacy and compact context budget",
  totalTrials: trials.length,
  acceptedTrials: accepted.length,
  rejectedTrials: rejected.length,
  selected: accepted[0],
  frontier: accepted.slice(0, 6),
  rejected,
};

mkdirSync("reports", { recursive: true });
writeFileSync("reports/abstraction_optimization.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
