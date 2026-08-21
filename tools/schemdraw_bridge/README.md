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
SVG. That would put raw SVG into a closed tag vocabulary, add a dependency to
the sandbox hot path, and give up per-variant value bindings.

## Setup

SchemDraw has **no dependencies** — notably not matplotlib — so a bare venv is
enough:

```bash
python -m venv .venv-schemdraw && .venv-schemdraw/Scripts/python -m pip install schemdraw
```

## Use

```bash
python tools/schemdraw_bridge/generate_examples.py --out backend/questions/<bundle>
```

`generate_examples.py` holds two worked examples — a unity feedback loop and an
RC low-pass. Copy one and edit the connectivity.

Authors describe what connects to what. Where the summing junction lands, how
long the feedback run is, and how wide each block is are all solved:

```python
builder = BlockDiagramBuilder(aria_label="...")
with schemdraw.Drawing(show=False) as d:
    builder.wire(d, dsp.Arrow().right().length(2), label="R(s)")
    summing = builder.node(d, dsp.SumSigma(), id="sum1", type="sum", signs="+-")
    builder.node(d, dsp.Box(w=2, h=1.2).label("C(s)"), id="controller",
                 type="transfer", label="C(s)", value_path="params.controller")
    ...
    definition = builder.build(d)
```

`value_path` is what ties a block to the adaptive runtime: it emits
`{"value": {"path": "params.controller"}}`, which the renderer resolves against
whatever `server.py` returned for that run.

## What the bridge handles

- **Axis flip.** SchemDraw's Y points up, SVG's points down.
- **Grid snapping** onto the editor's 20-unit grid, so generated files stay
  nudgeable by hand afterwards.
- **Centres derived from edge anchors**, never snapped independently — snapping a
  centre and its edges separately lets them disagree by half a grid step, which
  renders as a wire stopping just short of its block.
- **Port snapping.** Any wire endpoint within one grid step of a block port is
  pulled exactly onto it, the same rule the visual editor applies.
- **viewBox growth** to contain answer slots, which SchemDraw knows nothing about.

## What it does not handle

No automatic routing around obstacles, and no collision resolution between
answer slots and geometry. Answer slots are placed by explicit offset from an
anchor; reserve space for them yourself. If a generated diagram is crowded,
adjust the connectivity or nudge it afterwards in the editor.

## Verification

`frontend/src/.../visuals/shippedDefinitions.test.ts` validates every
`block-diagram.json` under `backend/questions/` against the renderer's own
validator, asserts each block has a wire attached, and asserts no endpoint sits
*near* a port without being *on* it.
