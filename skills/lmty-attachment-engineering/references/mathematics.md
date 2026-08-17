# LMTY mathematical reference

Use these formulas for an external L0/L1 control plane. State what is deterministic policy and what is measured from an actual inference runtime.

## Context allocation

For total budget `B`, default to `B_system=0.18B`, `B_attachment=0.22B`, `B_evidence=0.42B`, and `B_task=0.18B`. Verify that the weights sum to 1 before accepting a scenario.

## Memory selection

Normalize relevance `r`, recency `c`, reliability `f`, and utility `u` to `[0,1]`. Compute `s = 0.45r + 0.25c + 0.20f + 0.10u`. Sort descending by `s`, then retain items while cumulative tokens stay below the evidence budget. Describe this as greedy top-k under a budget, not an optimal knapsack solution.

## Relevance matrix

For task class `j`, materialize `R_ij = alpha_j r_i` only when the coefficients are a declared policy. Do not call `R` an embedding or learned representation without a training procedure and evidence.

## Structural score

Use `A = 0.22C + 0.20I + 0.22T + 0.20V + 0.16E`, where context balance `C`, capability isolation `I`, trace continuity `T`, verifier integrity `V`, and memory efficiency `E` are normalized to `[0,1]`. Pair score acceptance with hard invariants: budget conservation, non-empty explicit tool boundary, trace coverage, and verifier coverage.

## Pareto

Maximize quality and reliability; minimize tokens and complexity. Candidate `a` dominates `b` when it is no worse in all objectives and strictly better in at least one. Preserve all non-dominated candidates rather than forcing a scalar winner.

## Compression boundary

For a 16-bit external representation and policy bit-width `b`, the estimate `rho=16/b` is only an external-memory ratio. Require a provider ABI and measured distortion/quality trade-off before claiming internal KV-cache compression.
