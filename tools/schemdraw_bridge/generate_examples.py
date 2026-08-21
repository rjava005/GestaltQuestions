"""Spike: build real diagrams from connectivity and emit Gestalt JSON.

Run with the spike venv:

    python tools/schemdraw_bridge/generate_examples.py --out <dir>

Neither example places a single coordinate by hand -- SchemDraw solves the
layout from the described connections, and bridge.py reads the result back.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import schemdraw
import schemdraw.dsp as dsp
import schemdraw.elements as elm
from bridge import BlockDiagramBuilder, extract_circuit, write_json


def unity_feedback_loop() -> dict:
    """E132: R(s) -> sum -> C(s) -> G(s) -> Y(s), with unity feedback.

    The author states what connects to what. Where the summing junction lands,
    how long the feedback run is, and where the pickoff sits are all solved.
    """
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
            value_path="params.controller",
        )
        builder.wire(d, dsp.Arrow().right().length(2))
        builder.node(
            d,
            dsp.Box(w=2, h=1.2).label("G(s)"),
            id="plant",
            type="transfer",
            label="G(s)",
            value_path="params.plant",
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


def rc_low_pass() -> dict:
    """EE30B: series R into a shunt C across the output -- a first-order RC."""
    tagged: list[tuple[object, dict]] = []
    wires: list[object] = []

    with schemdraw.Drawing(show=False) as d:
        d.config(unit=2.5)

        source = d.add(elm.SourceV().up().label("Vin"))
        tagged.append(
            (source, {"id": "V1", "type": "voltageSource", "label": "Vin"})
        )

        resistor = d.add(elm.Resistor().right().label("R"))
        tagged.append(
            (
                resistor,
                {
                    "id": "R1",
                    "type": "resistor",
                    "label": "R",
                    "value_path": "params.R",
                    "unit": "ohm",
                },
            )
        )

        capacitor = d.add(elm.Capacitor().down().label("C"))
        tagged.append(
            (
                capacitor,
                {
                    "id": "C1",
                    "type": "capacitor",
                    "label": "C",
                    "value_path": "params.C",
                    "unit": "F",
                },
            )
        )

        wires.append(d.add(elm.Line().left()))

    return extract_circuit(
        d,
        tagged,
        aria_label="Series resistor feeding a shunt capacitor across the output",
        wires=wires,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=".", help="directory to write JSON into")
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    loop = unity_feedback_loop()
    circuit = rc_low_pass()
    write_json(loop, out / "block-diagram.json")
    write_json(circuit, out / "circuit.json")

    print(f"block-diagram.json  viewBox={loop['viewBox']} "
          f"nodes={len(loop['nodes'])} wires={len(loop['wires'])} "
          f"slots={len(loop.get('answerSlots', []))}")
    print(f"circuit.json        viewBox={circuit['viewBox']} "
          f"elements={len(circuit['elements'])} wires={len(circuit['wires'])}")


if __name__ == "__main__":
    main()
