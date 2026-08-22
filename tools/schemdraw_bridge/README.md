# SchemDraw bridge

Generates authored `block-diagram.json` / `circuit.json` from a **connectivity
description** instead of hand-placed coordinates.

This is an authoring aid. It runs offline, on a developer machine, and nothing
in it reaches the backend or the sandbox at request time.

## Why it works this way

The platform's rule is *coordinates in the file are the coordinates on screen* —
the renderer does no layout, no wire routing, and no collision handling. That
rule is what keeps the visual editor, adaptive parameter bindings, and the
`pl-*` tag contract simple.

SchemDraw is therefore used as a **layout solver, not a renderer**:

```
connectivity description (Python)
    -> SchemDraw computes positions
    -> bridge.py reads element anchors back out
    -> normal block-diagram.json / circuit.json with explicit coordinates
```

The emitted file is an ordinary authored asset. It renders through the existing
`PLBlockDiagram` / `PLCircuit` components, opens in the visual editor for
nudging, and carries parameter bindings like any hand-written file. Nothing
downstream knows SchemDraw was involved.

The rejected alternative was calling SchemDraw inside `server.py` and returning
SVG, or generating it there at all. `server.py` runs inside `code_sandbox` on
every student request — an isolated subprocess with no write-back to
persistent storage — so that would mean shipping SchemDraw in the sandbox
image, racing concurrent runs to write the same file, and putting raw SVG into
a closed tag vocabulary. `server.py` only ever supplies the *values* a
diagram's parameter bindings resolve against; it never touches SchemDraw.

## One script per question, not one shared file

Every question that wants a generated diagram owns
`backend/questions/<bundle>/generate_diagram.py`, describing only its own
connectivity:

```python
OUTPUT_FILENAME = "block-diagram.json"   # or "circuit.json"

def build() -> dict:
    ...  # connectivity only, returns the definition, no file I/O
```

`tools/schemdraw_bridge/regenerate.py` discovers every such script under
`backend/questions/` and never needs editing when a new question is added —
that discovery is the whole point: a control-systems question doesn't mean
touching this directory, it means dropping one small file into the question's
own folder.

## Setup and use

SchemDraw has **no dependencies** — notably not matplotlib — so a bare venv is
enough. The root `Makefile` wraps it:

```bash
make diagrams-setup
```

```bash
make diagrams
```

```bash
make diagrams-check
```

`diagrams` runs every discovered `generate_diagram.py` and writes
`OUTPUT_FILENAME` **only if it does not already exist** — this is what keeps
re-running it from ever clobbering a hand-edit made afterward in the visual
editor. Delete a committed file first to intentionally rebuild its layout.
`diagrams-check` builds every script fresh in memory and compares the result
against the committed file without writing anything, so a diagram that no
longer matches the connectivity it claims to come from fails loudly. `make` is
not bundled with Git for Windows — install it, or run the commands under each
target directly, since they are all one-liners.

A script is also directly runnable on its own, for iterating on one diagram
without going through the full discovery sweep:

```bash
PYTHONPATH=tools/schemdraw_bridge tools/schemdraw_bridge/.venv/Scripts/python backend/questions/<bundle>/generate_diagram.py
```

Copy `framework_schemdraw_demo/generate_diagram.py` (a block diagram) or
`framework_schemdraw_circuit_demo/generate_diagram.py` (a circuit) as a
starting point.

Authors describe what connects to what. Where the summing junction lands, how
long the feedback run is, and how wide each block is are all solved:

```python
from bridge import BlockDiagramBuilder, generate_if_missing

OUTPUT_FILENAME = "block-diagram.json"

def build() -> dict:
    builder = BlockDiagramBuilder(aria_label="...")
    with schemdraw.Drawing(show=False) as d:
        builder.wire(d, dsp.Arrow().right().length(2), label="R(s)")
        summing = builder.node(d, dsp.SumSigma(), id="sum1", type="sum", signs="+-")
        builder.node(d, dsp.Box(w=2, h=1.2).label("C(s)"), id="controller",
                     type="transfer", label="C(s)", value_path="controller")
        ...
        return builder.build(d)

if __name__ == "__main__":
    generate_if_missing(Path(__file__).parent / OUTPUT_FILENAME, build)
```

`value_path` is what ties a block to the adaptive runtime: it emits
`{"value": {"path": "controller"}}`, which the renderer resolves as a key
directly against whatever `params` dict `server.py`'s `generate()` returned for
that run -- **not** prefixed with `params.`, since the renderer is already
handed `quiz_data.params` itself, not the whole `quiz_data` object. Every
hand-authored circuit in this repo binds the same way (`"path": "resistance"`,
never `"path": "params.resistance"`); getting this prefix wrong is silent --
the bound field just renders as `—` instead of erroring.

## What the bridge handles

- **Axis flip.** SchemDraw's Y points up, SVG's points down.
- **Grid snapping** onto the editor's 20-unit grid, so generated files stay
  nudgeable by hand afterwards.
- **Centres derived from edge anchors**, never snapped independently — snapping a
  centre and its edges separately lets them disagree by half a grid step, which
  renders as a wire stopping just short of its block.
- **A per-axis anchor lookup**, not a nearest-port guess. Each node records the
  continuous SchemDraw coordinate of every anchor it contributed (W/E/N/S/
  centre) against its own already-decided port coordinate. A wire endpoint
  whose raw x or y matches one exactly reuses that port coordinate instead of
  independently re-snapping the same raw value. That independent re-snap is
  not just redundant, it can be wrong: a node's centre can land exactly
  halfway between two grid lines (a genuine floating-point tie with no correct
  rounding), and a wire built from that same raw value can break the tie the
  other way, landing a full grid step off from a port that renders correctly.
  Matching per axis, not per full point, is what lets a routing corner several
  segments away from the node still resolve correctly — it shares only one
  coordinate with the node it's ultimately headed for.
- **viewBox growth** to contain answer slots, which SchemDraw knows nothing about.

## What it does not handle

No automatic routing around obstacles, and no collision resolution between
answer slots and geometry. Answer slots are placed by explicit offset from an
anchor; reserve space for them yourself. If a generated diagram is crowded,
adjust the connectivity or nudge it afterwards in the editor.

## Verification

`frontend/src/.../visuals/shippedDefinitions.test.ts` validates every
`block-diagram.json` and `circuit.json` under `backend/questions/` against the
renderer's own validators, asserts each block-diagram node has a wire attached
to one of its ports, and asserts every wire segment and two-terminal circuit
element is axis-aligned — this repo's diagrams are Manhattan-routed by
convention, so a diagonal segment is always a bug.
