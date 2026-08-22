"""Connectivity source for this question's block-diagram.json.

Only the connections are described here -- SchemDraw solves where the
summing junction lands, how long the feedback run is, and where the pickoff
sits. bridge.py (tools/schemdraw_bridge) reads the resulting geometry back
out and turns it into the authored JSON the renderer actually uses.

Run via `make diagrams` (discovers every generate_diagram.py under
backend/questions/ and regenerates only what's missing), or standalone with
tools/schemdraw_bridge on PYTHONPATH:

    PYTHONPATH=tools/schemdraw_bridge python backend/questions/framework_schemdraw_demo/generate_diagram.py

Either way, this is a no-op once block-diagram.json exists -- delete it
first to intentionally rebuild the layout.
"""

from __future__ import annotations

from pathlib import Path

import schemdraw
import schemdraw.dsp as dsp
from bridge import BlockDiagramBuilder, generate_if_missing

OUTPUT_FILENAME = "block-diagram.json"


def build() -> dict:
    """E132: R(s) -> sum -> C(s) -> G(s) -> Y(s), with unity feedback."""
    builder = BlockDiagramBuilder(
        aria_label=(
            "Unity feedback loop: reference into a summing junction, then "
            "controller C of s, then plant G of s, with the output fed back"
        )
    )

    with schemdraw.Drawing(show=False) as d:
        d.config(unit=1.5)

        builder.wire(d, dsp.Arrow().right().length(2), label="R(s)")
        summing = builder.node(
            d, dsp.SumSigma(), id="sum1", type="sum", signs="+-"
        )
        builder.wire(d, dsp.Arrow().right().length(2), label="E(s)")
        builder.node(
            d,
            dsp.Box(w=2, h=1.2).label("C(s)"),
            id="controller",
            type="transfer",
            label="C(s)",
            value_path="controller",
        )
        builder.wire(d, dsp.Arrow().right().length(2))
        builder.node(
            d,
            dsp.Box(w=2, h=1.2).label("G(s)"),
            id="plant",
            type="transfer",
            label="G(s)",
            value_path="plant",
        )
        builder.wire(d, dsp.Arrow().right().length(2))
        pickoff = builder.node(d, dsp.Dot(), id="pickoff", type="pickoff")
        builder.wire(d, dsp.Arrow().right().length(2), label="Y(s)")

        # Feedback: drop from the pickoff, run back under the forward path, and
        # rise into the summing junction's south anchor.
        down = builder.wire(
            d, dsp.Line().down().at(pickoff.absanchors["center"]).length(2),
            feedback=True,
        )
        back = builder.wire(
            d,
            dsp.Line().left().at(down.absanchors["end"]).tox(
                summing.absanchors["center"][0]
            ),
            feedback=True,
        )
        builder.wire(
            d,
            dsp.Arrow().up().at(back.absanchors["end"]).toy(
                summing.absanchors["S"][1]
            ),
            feedback=True,
        )

        # An answer block for the closed-loop transfer function, parked clear of
        # the forward path -- the renderer will not move it out of the way.
        builder.answer_slot(
            pickoff.absanchors["center"],
            id="slot_closed_loop",
            answer_name="closed_loop",
            kind="math",
            label="T(s)",
            offset=(0.0, 2.0),
            width=200,
            height=90,
        )

        return builder.build(d)


if __name__ == "__main__":
    generate_if_missing(Path(__file__).parent / OUTPUT_FILENAME, build)
