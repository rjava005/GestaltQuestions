"""Compare a committed visual definition against freshly generated output.

Deliberately uses no external tools. `git diff` and GNU `diff` are both absent
from some of the containers this repo runs in, and a missing binary makes a
comparison look like a mismatch rather than an error.

Line endings are normalised: the generator always writes LF, while a Windows
checkout with core.autocrlf=true holds CRLF, and that difference is not drift.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def _load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: check_drift.py <committed.json> <generated.json>")
        return 2

    committed, generated = Path(sys.argv[1]), Path(sys.argv[2])
    for path in (committed, generated):
        if not path.is_file():
            print(f"DRIFT: {path} does not exist")
            return 1

    # Compare parsed JSON so formatting and line endings cannot register as
    # drift -- only a real change in the geometry should fail this.
    if _load(committed) == _load(generated):
        print(f"OK: {committed.name} matches its connectivity source")
        return 0

    print(f"DRIFT: {committed} differs from what the generator produces")
    print(f"       generated copy left at {generated} for inspection")
    print("       run 'make diagrams' to regenerate, or reconcile by hand")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
