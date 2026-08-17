---
name: lmty-attachment-engineering
description: Build, evaluate, document, and operationalize LMTY model attachments (`.lmty`) and Model Attachment Layer (MAL) systems. Use when creating an attachment runtime, compiling a specialization from JSONL/CSV evidence, designing external-memory/context policies, calculating Pareto candidates, adding CLI or Studio dashboards, running reproducible evaluations, or packaging LMTY artifacts for GitHub.
---

# LMTY Attachment Engineering

Use this skill to turn an LMTY concept into an auditable attachment system. Keep the distinction explicit between **external behavioral specialization** (available now) and **provider-internal intervention** (KV cache, prefix K/V, logits, activations), which requires a documented inference ABI.

## Workflow

1. **Classify scope.** Determine whether the request is runtime-only, CLI, web Studio, evaluation, documentation, or a combination. Define the attachment domain, success metric, context budget, allowed tools, verifier policy, and provider boundary.
2. **Model the artifact.** Use `templates/attachment_manifest.json` as the base contract. Preserve the `.lmty` extension in user-facing artifact names. Model dataset, attachment, candidate, MAL session, trace, and context item explicitly.
3. **Implement the L0/L1 control plane.** Build package loading, route policy, explicit capability boundary, external-memory retrieval, deterministic verifiers, session state, and trace emission. Do not claim weights, KV cache, logits, or activations are touched unless the runtime exposes that ABI.
4. **Implement the mathematical policy.** Read `references/mathematics.md`. Calculate context layers, relevance scores, top-k evidence selection, relevance matrix, Pareto dominance, and structural acceptance score. Use deterministic fixtures when measuring architecture; do not present them as external-model benchmarks.
5. **Expose reproducibility.** Add CLI commands for context inspection, abstraction diagnosis, graph rendering, scenarios, and optimization. Emit JSON reports and, when useful, Mermaid graph output. Use `scripts/validate_abstraction_report.py` to validate report shape.
6. **Add a Studio when a visual surface is requested.** Build ingestion, compiler controls, MAL session, memory/context, Pareto, traces, artifact inspector, and abstraction graph. Treat uploads as S3-backed metadata; do not store file bytes in the database.
7. **Validate.** Test runtime contracts, policy calculations, CLI output, graph feedback edge, Pareto transformation, and database/schema changes. Enforce a cyclomatic-complexity gate if requested; target 2 by separating calculations, routing, and I/O.
8. **Document and publish.** Write a README, a three-level mathematics explanation, an acceptance report, and explicit limitations. Run tests, type checks, and build. Commit only intended artifacts and push to a private GitHub repository unless the user requests otherwise.

## Architecture boundary

| Level | Implement now | Requires provider ABI |
|---|---|---|
| L0 | System/attachment policy, routing, tools, verifiers, traces | No |
| L1 | External memory, state, context selection, behavior policy | No |
| L2+ | Prefix/KV cache, logits, activation steering, internal quantization | Yes |

> Treat TurboQuant-style compression as an **external-memory policy** unless a provider exposes internal vectors and a compatible ABI. Record the distinction in every technical report.

## Minimum mathematical contract

Use context layers that conserve the budget. A sensible default is `system=0.18B`, `attachment=0.22B`, `evidence=0.42B`, `task=0.18B`. Score a memory item as `0.45r + 0.25c + 0.20f + 0.10u`, where relevance, recency, reliability, and utility are normalized to `[0,1]`.

Select evidence greedily by descending score while total tokens stay within `B_evidence`. State that this is deterministic but not a globally optimal knapsack solver. For a 16-bit external representation associated with `b` bits, expose the policy estimate `rho = 16 / b`; never call it measured compression without implementation evidence.

Accept an abstraction scenario only when the weighted structural score and hard invariants pass. Use the detailed formulas in `references/mathematics.md`.

## Quality gates

Run these checks before delivery:

```bash
# Python runtime example
PYTHONPATH=. python3 -m unittest discover -s tests -v

# Studio example
pnpm test && pnpm check && pnpm build

# Graph/abstraction report contract
python3 /path/to/validate_abstraction_report.py reports/abstraction_optimization.json
```

When a schema changes, generate and review migration SQL before applying it. When a user requests a PDF, read the PDF-generation skill first and preserve validation artifacts. When publishing code, use the GitHub CLI and verify remote, branch, visibility, commit, and clean status.

## Reusable resources

| Resource | Use when |
|---|---|
| `templates/attachment_manifest.json` | Starting a manifest or artifact schema. |
| `scripts/bootstrap_lmty_workspace.py` | Creating a minimal runtime, package, docs, reports, and test layout. |
| `scripts/validate_abstraction_report.py` | Checking a generated scenario/optimization report before release. |
| `references/mathematics.md` | Writing formulas, metrics, or mathematical documentation. |
| `references/release-checklist.md` | Preparing tests, reports, GitHub commits, and delivery. |

## Output requirements

Deliver concrete artifacts, not merely design notes: source code, tests, reports, a README, and the generated `.lmty` artifact or manifest. Clearly label deterministic architectural metrics, synthetic fixtures, provider-dependent assumptions, and benchmark limitations.
