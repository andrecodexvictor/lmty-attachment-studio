export type Attachment = {
  id: string;
  name: string;
  domain: string;
  version: string;
  status: "ready" | "compiling";
  quality: number;
  reliability: number;
  contextBudget: number;
  tools: string[];
  createdAt: number;
};

export type Trace = {
  id: string;
  sessionId: string;
  route: string;
  verifiers: string[];
  score: number;
  latencyMs: number;
  createdAt: number;
};

export type MalSession = {
  id: string;
  attachmentId: string;
  stateCalls: number;
  enabledTools: string[];
  traces: Trace[];
};

export type Dataset = {
  id: string;
  name: string;
  format: "JSONL" | "CSV" | "manual";
  records: number;
  domain: string;
  label: string;
  createdAt: number;
};

export type ContextItem = {
  id: string;
  label: string;
  tokens: number;
  relevance: number;
  recency: number;
  reliability: number;
  utility: number;
};

export type Candidate = {
  id: string;
  name: string;
  attachmentId: string;
  quality: number;
  tokens: number;
  complexity: number;
  reliability: number;
  status: "pareto" | "dominated";
};

const now = () => Date.now();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const attachments: Attachment[] = [
  { id: "att_frontend", name: "frontend.lmty", domain: "Frontend Systems", version: "1.3.0", status: "ready", quality: 0.91, reliability: 0.94, contextBudget: 420, tools: ["browser", "test_runner", "typecheck"], createdAt: now() - 86_400_000 },
  { id: "att_postgres", name: "postgres.lmty", domain: "PostgreSQL Operations", version: "0.8.2", status: "ready", quality: 0.87, reliability: 0.9, contextBudget: 360, tools: ["filesystem", "sql_runner"], createdAt: now() - 172_800_000 },
];

const datasets: Dataset[] = [
  { id: "data_frontend", name: "frontend_eval_v4.jsonl", format: "JSONL", records: 184, domain: "Frontend Systems", label: "visual_ui", createdAt: now() - 43_200_000 },
];

const sessions: MalSession[] = [];

const candidates: Candidate[] = [
  { id: "candidate_frontend", name: "frontend.lmty", attachmentId: "att_frontend", quality: 0.91, tokens: 420, complexity: 3, reliability: 0.94, status: "pareto" },
  { id: "candidate_postgres", name: "postgres.lmty", attachmentId: "att_postgres", quality: 0.87, tokens: 360, complexity: 4.7, reliability: 0.9, status: "pareto" },
];

const memoryItems: ContextItem[] = [
  { id: "mem_01", label: "Project conventions", tokens: 72, relevance: 0.96, recency: 0.8, reliability: 0.98, utility: 0.93 },
  { id: "mem_02", label: "Visual regression evidence", tokens: 118, relevance: 0.92, recency: 0.9, reliability: 0.94, utility: 0.88 },
  { id: "mem_03", label: "Prior hydration trace", tokens: 96, relevance: 0.86, recency: 0.73, reliability: 0.91, utility: 0.84 },
  { id: "mem_04", label: "Legacy CSS notes", tokens: 154, relevance: 0.52, recency: 0.41, reliability: 0.65, utility: 0.48 },
  { id: "mem_05", label: "Accessibility policy", tokens: 68, relevance: 0.75, recency: 0.68, reliability: 0.99, utility: 0.9 },
];

export const lmtyStore = {
  snapshot() {
    const traces = sessions.flatMap(session => session.traces);
    const quality = attachments.reduce((total, item) => total + item.quality, 0) / attachments.length;
    const reliability = attachments.reduce((total, item) => total + item.reliability, 0) / attachments.length;
    return { attachments, datasets, sessions, traces, candidates, metrics: { quality, reliability, activeSessions: sessions.length } };
  },
  ingest(input: Omit<Dataset, "id" | "createdAt">) {
    const dataset = { ...input, id: id("data"), createdAt: now() };
    datasets.unshift(dataset);
    return dataset;
  },
  compile(input: { domain: string; contextBudget: number; tools: string[]; qualityTarget: number; datasetId: string }) {
    const ordinal = attachments.filter(item => item.domain === input.domain).length + 1;
    const attachment: Attachment = { id: id("att"), name: `${input.domain.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${ordinal}.lmty`, domain: input.domain, version: `0.${ordinal}.0`, status: "ready", quality: Math.min(0.98, input.qualityTarget + 0.02), reliability: Math.min(0.98, input.qualityTarget + 0.04), contextBudget: input.contextBudget, tools: input.tools, createdAt: now() };
    attachments.unshift(attachment);
    candidates.unshift({ id: id("candidate"), name: attachment.name, attachmentId: attachment.id, quality: attachment.quality, tokens: attachment.contextBudget, complexity: 3.2 + ordinal * 0.5, reliability: attachment.reliability, status: "pareto" });
    return attachment;
  },
  openSession(attachmentId: string, enabledTools: string[]) {
    const session: MalSession = { id: id("mal"), attachmentId, enabledTools, stateCalls: 0, traces: [] };
    sessions.unshift(session);
    return session;
  },
  runTask(sessionId: string, task: string) {
    const session = sessions.find(item => item.id === sessionId);
    if (!session) throw new Error("MAL session not found");
    const lower = task.toLowerCase();
    const route = lower.includes("visual") || lower.includes("layout") ? "inspect_repo → render → visual_verify" : lower.includes("bug") || lower.includes("erro") ? "reproduce → isolate → patch → regression" : "inspect_repo → plan → implement → verify";
    session.stateCalls += 1;
    const trace: Trace = { id: id("trace"), sessionId, route, verifiers: route.includes("visual") ? ["typecheck", "visual_diff", "a11y"] : ["typecheck", "scoped_tests"], score: 0.93, latencyMs: 180 + session.stateCalls * 16, createdAt: now() };
    session.traces.unshift(trace);
    return { session, trace };
  },
  optimizeContext(contextBudget: number, quantizedBits: number) {
    const evidenceBudget = Math.round(contextBudget * 0.42);
    const ranked = memoryItems.map(item => ({ ...item, score: 0.45 * item.relevance + 0.25 * item.recency + 0.2 * item.reliability + 0.1 * item.utility })).sort((left, right) => right.score - left.score);
    let usedTokens = 0;
    const selected = ranked.filter(item => {
      const fits = usedTokens + item.tokens <= evidenceBudget;
      if (fits) usedTokens += item.tokens;
      return fits;
    });
    const relevanceMatrix = ranked.map(item => ({ label: item.label, visualUi: Number((item.relevance * 0.98).toFixed(2)), debugging: Number((item.relevance * 0.92).toFixed(2)), performance: Number((item.relevance * 0.78).toFixed(2)) }));
    const retainedScore = selected.reduce((total, item) => total + item.score, 0) / selected.length;
    return { layers: { system: Math.round(contextBudget * 0.18), attachment: Math.round(contextBudget * 0.22), evidence: evidenceBudget, task: Math.round(contextBudget * 0.18) }, ranked, selected, relevanceMatrix, metrics: { contextBudget, evidenceBudget, usedTokens, retainedItems: selected.length, quantizedBits, compressionRatio: Number((16 / quantizedBits).toFixed(2)), retainedScore: Number(retainedScore.toFixed(3)), mode: "external-memory" } };
  },
};
