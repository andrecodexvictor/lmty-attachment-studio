#!/usr/bin/env python3
"""Validate minimal LMTY abstraction report invariants."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def load_report(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def selected_result(report: dict[str, object]) -> dict[str, object]:
    if isinstance(report.get("selected"), dict):
        return report["selected"]
    results = report.get("results", [])
    if isinstance(results, list) and results:
        return results[0]
    raise ValueError("Report has no selected candidate or results")


def extract_diagnostic(candidate: dict[str, object]) -> dict[str, object]:
    diagnostic = candidate.get("result", candidate)
    if not isinstance(diagnostic, dict):
        raise ValueError("Candidate result is not an object")
    return diagnostic


def validate(diagnostic: dict[str, object]) -> list[str]:
    invariants = diagnostic.get("hardInvariants", {})
    score = diagnostic.get("score", 0)
    if not isinstance(invariants, dict):
        return ["hardInvariants must be an object"]
    errors = [name for name, passed in invariants.items() if not passed]
    if not isinstance(score, (int, float)) or score < 0.9:
        errors.append("score must be at least 0.90")
    return errors


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: validate_abstraction_report.py <report.json>")
    report = load_report(Path(sys.argv[1]))
    diagnostic = extract_diagnostic(selected_result(report))
    errors = validate(diagnostic)
    if errors:
        raise SystemExit("INVALID: " + "; ".join(errors))
    print(json.dumps({"status": "PASS", "score": diagnostic["score"], "invariants": diagnostic["hardInvariants"]}, indent=2))


if __name__ == "__main__":
    main()
