export type ParetoCandidate = {
  name: string;
  quality: number;
  tokens: number;
  complexity: number;
  reliability: number;
};

export function toParetoData(candidates: ParetoCandidate[]) {
  return candidates.map(item => ({
    name: item.name,
    quality: Number((item.quality * 100).toFixed(1)),
    tokens: item.tokens,
    complexity: item.complexity,
    reliability: item.reliability,
  }));
}
