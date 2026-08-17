#!/usr/bin/env python3
"""Create a minimal, auditable LMTY workspace without external dependencies."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


DIRECTORIES = ("lmty/runtime", "lmty/compiler", "lmty/evals", "examples", "reports", "tests", "docs")


def make_directories(root: Path) -> None:
    for relative_path in DIRECTORIES:
        (root / relative_path).mkdir(parents=True, exist_ok=True)


def build_manifest(domain: str) -> dict[str, object]:
    slug = "-".join(domain.lower().split())
    return {
        "name": f"{slug}.lmty",
        "version": "0.1.0",
        "abi": "lmty-attachment/0.1",
        "domain": domain,
        "minimum_access": "B0",
        "preferred_backend": "behavioral-stateful",
        "context_window": {"policy": "layered", "external_memory": "enabled"},
        "policy": {"context_budget": 640, "allowed_tools": ["filesystem", "test_runner", "typecheck"]},
        "verification": ["typecheck", "scoped_tests", "task_specific"],
    }


def write_json(path: Path, content: dict[str, object]) -> None:
    path.write_text(json.dumps(content, indent=2) + "\n", encoding="utf-8")


def write_readme(root: Path, domain: str) -> None:
    content = f"# {domain} LMTY Workspace\n\nThis workspace contains a behavioral L0/L1 attachment scaffold. Start by defining routes, tools, verifiers, context policy, tests, and reproducible reports.\n"
    (root / "README.md").write_text(content, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an LMTY attachment workspace")
    parser.add_argument("output", type=Path, help="Directory to create")
    parser.add_argument("--domain", default="General Operations", help="Attachment domain")
    args = parser.parse_args()
    root = args.output.resolve()
    make_directories(root)
    write_json(root / "examples" / "attachment.lmty.json", build_manifest(args.domain))
    write_readme(root, args.domain)
    print(json.dumps({"workspace": str(root), "manifest": str(root / "examples" / "attachment.lmty.json")}, indent=2))


if __name__ == "__main__":
    main()
