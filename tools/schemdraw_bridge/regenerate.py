"""Discover and (re)build every question's generated visual definition.

Each ``backend/questions/<bundle>/generate_diagram.py`` is a small,
self-contained connectivity description. It exposes exactly two things:

    OUTPUT_FILENAME = "block-diagram.json"   # or "circuit.json"

    def build() -> dict:
        ...  # connectivity only, returns the definition dict, no file I/O

This script never needs to change when a new question is added -- it just
finds every such script under backend/questions/ and, for each:

  (default) writes OUTPUT_FILENAME only if it does not already exist, so a
            hand-edit made afterward in the visual editor is never clobbered.
  --check   builds fresh in memory and compares it against the committed
            file without writing anything, so a diagram that no longer
            matches the connectivity it claims to come from fails loudly.

Since build() returns the definition directly, --check is a plain dict
comparison -- no scratch directory, no file-to-file diffing, and no
dependency on git or diff being present in whatever environment this runs in.

Run via `make diagrams` / `make diagrams-check`, or directly with
tools/schemdraw_bridge on PYTHONPATH:

    PYTHONPATH=tools/schemdraw_bridge python tools/schemdraw_bridge/regenerate.py [--check]
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from types import ModuleType

from bridge import generate_if_missing

REPO_ROOT = Path(__file__).resolve().parents[2]
QUESTIONS_DIR = REPO_ROOT / "backend" / "questions"


def discover() -> list[Path]:
    return sorted(QUESTIONS_DIR.glob("*/generate_diagram.py"))


def _load(script: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location(script.stem, script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load module spec from {script}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(check: bool) -> bool:
    scripts = discover()
    if not scripts:
        print(f"No generate_diagram.py scripts found under {QUESTIONS_DIR}")
        return True

    ok = True
    for script in scripts:
        module = _load(script)
        output_path = script.parent / module.OUTPUT_FILENAME
        label = f"{script.parent.name}/{module.OUTPUT_FILENAME}"

        if not check:
            generate_if_missing(output_path, module.build)
            continue

        fresh = module.build()
        if not output_path.exists():
            print(f"MISSING: {label} (run 'make diagrams' to create it)")
            ok = False
            continue
        committed = json.loads(output_path.read_text(encoding="utf-8"))
        if fresh == committed:
            print(f"OK: {label} matches its connectivity source")
        else:
            print(f"DRIFT: {label} differs from what the generator produces")
            print("       run 'make diagrams' to regenerate, or reconcile by hand")
            ok = False
    return ok


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="compare against committed files instead of writing anything",
    )
    args = parser.parse_args()
    if not run(check=args.check):
        sys.exit(1)


if __name__ == "__main__":
    main()
