# LMTY release checklist

1. Validate all manifests end in `.lmty` and have explicit domain, budget, tools, verifiers, and version.
2. Run runtime tests, CLI tests, math/policy tests, type checks, and production build.
3. Regenerate JSON reports, Pareto output, graph output, and final diagnostic.
4. Label deterministic fixtures and architectural metrics; disclose provider-dependent boundaries.
5. Update README, math note, acceptance report, and artifact inventory.
6. Review database migration SQL before applying it.
7. Confirm `git diff --check`, clean status, private GitHub remote, default branch, latest commit, and push success.
8. If a PDF is requested, compile, verify, and visually inspect it before delivery.
