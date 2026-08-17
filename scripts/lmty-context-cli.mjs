const args = process.argv.slice(2);
const value = name => args[args.indexOf(name) + 1];
const artifact = value("--artifact") ?? "frontend.lmty";
const budget = Number(value("--budget") ?? 640);
const bits = Number(value("--bits") ?? 4);

const memories = [
  { id: "mem_01", label: "Project conventions", tokens: 72, relevance: 0.96, recency: 0.8, reliability: 0.98, utility: 0.93 },
  { id: "mem_02", label: "Visual regression evidence", tokens: 118, relevance: 0.92, recency: 0.9, reliability: 0.94, utility: 0.88 },
  { id: "mem_03", label: "Prior hydration trace", tokens: 96, relevance: 0.86, recency: 0.73, reliability: 0.91, utility: 0.84 },
  { id: "mem_04", label: "Legacy CSS notes", tokens: 154, relevance: 0.52, recency: 0.41, reliability: 0.65, utility: 0.48 },
  { id: "mem_05", label: "Accessibility policy", tokens: 68, relevance: 0.75, recency: 0.68, reliability: 0.99, utility: 0.9 },
];

const score = item => 0.45 * item.relevance + 0.25 * item.recency + 0.2 * item.reliability + 0.1 * item.utility;
const evidenceBudget = Math.round(budget * 0.42);
const ranked = memories.map(item => ({ ...item, score: Number(score(item).toFixed(3)) })).sort((left, right) => right.score - left.score);
let usedTokens = 0;
const selected = ranked.filter(item => {
  const fits = usedTokens + item.tokens <= evidenceBudget;
  if (fits) usedTokens += item.tokens;
  return fits;
});

console.log(JSON.stringify({
  command: "lmty context optimize",
  artifact,
  mode: "external-memory",
  providerRequirement: "KV cache quantization requires provider ABI",
  layers: { system: Math.round(budget * 0.18), attachment: Math.round(budget * 0.22), evidence: evidenceBudget, task: Math.round(budget * 0.18) },
  compression: { technique: "TurboQuant-inspired policy", quantizedBits: bits, estimatedRatio: Number((16 / bits).toFixed(2)) },
  selected,
  usedTokens,
}, null, 2));
