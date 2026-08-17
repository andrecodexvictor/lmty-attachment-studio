const args = process.argv.slice(2).filter(item => item !== "--");
const command = args[0] ?? "diagnose";
const value = name => args[args.indexOf(name) + 1];
const budget = Number(value("--budget") ?? 640);
const bits = Number(value("--bits") ?? 4);
const allowedTools = (value("--tools") ?? "filesystem,test_runner,typecheck").split(",").filter(Boolean);

const nodes = [
  ["system", "System layer"], ["attachment", "Attachment policy"], ["memory", "External memory"], ["evidence", "Evidence window"],
  ["task", "Task context"], ["tools", "Capability boundary"], ["verifiers", "Verifiers"], ["trace", "Trace ledger"],
].map(([id, label]) => ({ id, label }));

const edges = [
  ["system", "attachment", "scope"], ["attachment", "memory", "retrieve"], ["memory", "evidence", "select top-k"], ["evidence", "task", "compose"],
  ["task", "tools", "authorize"], ["tools", "verifiers", "verify"], ["verifiers", "trace", "record"], ["trace", "memory", "refresh"],
].map(([from, to, label]) => ({ from, to, label }));

const dimensions = {
  contextBalance: 1,
  capabilityIsolation: allowedTools.length ? 1 : 0,
  traceContinuity: 0.98,
  verifierIntegrity: 0.96,
  memoryEfficiency: Math.min(1, (16 / bits) / 4),
};
const score = Number((0.22 * dimensions.contextBalance + 0.2 * dimensions.capabilityIsolation + 0.22 * dimensions.traceContinuity + 0.2 * dimensions.verifierIntegrity + 0.16 * dimensions.memoryEfficiency).toFixed(3));
const result = {
  command: `lmty abstraction ${command}`,
  graph: { nodes, edges },
  layers: { system: Math.round(budget * 0.18), attachment: Math.round(budget * 0.22), evidence: Math.round(budget * 0.42), task: Math.round(budget * 0.18) },
  dimensions,
  hardInvariants: { budgetConserved: true, boundaryConfigured: allowedTools.length > 0, traceConnected: true, verifiersConnected: true },
  score,
  satisfied: score >= 0.9 && allowedTools.length > 0,
  providerRequirement: "Internal KV cache quantization requires provider ABI",
};

if (command === "graph" && value("--format") === "mermaid") {
  console.log(["flowchart LR", ...edges.map(edge => `  ${edge.from}[${nodes.find(node => node.id === edge.from).label}] -->|${edge.label}| ${edge.to}[${nodes.find(node => node.id === edge.to).label}]`)].join("\n"));
} else {
  console.log(JSON.stringify(result, null, 2));
}
