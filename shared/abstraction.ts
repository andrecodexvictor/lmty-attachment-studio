export type AbstractionNode = {
  id: string;
  label: string;
  category: "layer" | "memory" | "boundary" | "evidence";
};

export type AbstractionEdge = {
  from: string;
  to: string;
  label: string;
  capacity: number;
};

export type AbstractionInput = {
  contextBudget: number;
  quantizedBits: number;
  allowedTools: string[];
  traceCoverage: number;
  verifierCoverage: number;
};

const layerWeights = { system: 0.18, attachment: 0.22, evidence: 0.42, task: 0.18 };

export function createAbstractionGraph(input: AbstractionInput) {
  const nodes: AbstractionNode[] = [
    { id: "system", label: "System layer", category: "layer" },
    { id: "attachment", label: "Attachment policy", category: "layer" },
    { id: "memory", label: "External memory", category: "memory" },
    { id: "evidence", label: "Evidence window", category: "memory" },
    { id: "task", label: "Task context", category: "layer" },
    { id: "tools", label: "Capability boundary", category: "boundary" },
    { id: "verifiers", label: "Verifiers", category: "evidence" },
    { id: "trace", label: "Trace ledger", category: "evidence" },
  ];
  const evidenceBudget = Math.round(input.contextBudget * layerWeights.evidence);
  const edges: AbstractionEdge[] = [
    { from: "system", to: "attachment", label: "scope", capacity: Math.round(input.contextBudget * layerWeights.system) },
    { from: "attachment", to: "memory", label: "retrieve", capacity: Math.round(input.contextBudget * layerWeights.attachment) },
    { from: "memory", to: "evidence", label: "select top-k", capacity: evidenceBudget },
    { from: "evidence", to: "task", label: "compose", capacity: evidenceBudget },
    { from: "task", to: "tools", label: "authorize", capacity: input.allowedTools.length },
    { from: "tools", to: "verifiers", label: "verify", capacity: Math.round(input.verifierCoverage * 100) },
    { from: "verifiers", to: "trace", label: "record", capacity: Math.round(input.traceCoverage * 100) },
    { from: "trace", to: "memory", label: "refresh", capacity: Math.round(input.traceCoverage * 100) },
  ];
  return { nodes, edges, layerWeights, evidenceBudget };
}

export function evaluateAbstraction(input: AbstractionInput) {
  const graph = createAbstractionGraph(input);
  const layerConservation = Object.values(graph.layerWeights).reduce((total, value) => total + value, 0);
  const contextBalance = Number((1 - Math.abs(1 - layerConservation)).toFixed(3));
  const capabilityIsolation = input.allowedTools.length > 0 ? 1 : 0;
  const traceContinuity = Number(Math.min(1, input.traceCoverage).toFixed(3));
  const verifierIntegrity = Number(Math.min(1, input.verifierCoverage).toFixed(3));
  const memoryEfficiency = Number(Math.min(1, (16 / input.quantizedBits) / 4).toFixed(3));
  const score = Number((0.22 * contextBalance + 0.2 * capabilityIsolation + 0.22 * traceContinuity + 0.2 * verifierIntegrity + 0.16 * memoryEfficiency).toFixed(3));
  const hardInvariants = {
    budgetConserved: layerConservation === 1,
    boundaryConfigured: input.allowedTools.length > 0,
    traceConnected: input.traceCoverage >= 0.9,
    verifiersConnected: input.verifierCoverage >= 0.9,
  };
  const satisfied = score >= 0.9 && Object.values(hardInvariants).every(Boolean);
  const bottlenecks = graph.edges.filter(edge => edge.capacity === Math.min(...graph.edges.map(candidate => candidate.capacity))).map(edge => `${edge.from} → ${edge.to}`);
  return { ...graph, dimensions: { contextBalance, capabilityIsolation, traceContinuity, verifierIntegrity, memoryEfficiency }, hardInvariants, score, satisfied, bottlenecks };
}
