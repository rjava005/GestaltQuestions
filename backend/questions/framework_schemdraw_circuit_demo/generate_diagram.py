"""Connectivity source for this question's circuit.json.

Only the components and how they connect are described here -- a voltage
source, a series resistor, and a shunt capacitor, chained left to right and
closed with a return wire. SchemDraw solves the wire routing; bridge.py
(tools/schemdraw_bridge) reads the resulting geometry back out and turns it
into the authored JSON the renderer actually uses.

Run via `make diagrams` (discovers every generate_diagram.py under
backend/questions/ and regenerates only what's missing), or standalone with
tools/schemdraw_bridge on PYTHONPATH:

    PYTHONPATH=tools/schemdraw_bridge python backend/questions/framework_schemdraw_circuit_demo/generate_diagram.py

Either way, this is a no-op once circuit.json exists -- delete it first to
intentionally rebuild the layout.
"""

from __future__ import annotations

from pathlib import Path

import schemdraw
import schemdraw.elements as elm
from bridge import extract_circuit, generate_if_missing

OUTPUT_FILENAME = "circuit.json"


def build() -> dict:
    """EE30B: series R into a shunt C across the output -- a first-order RC
    low-pass filter."""
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
                    "value_path": "R",
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
                    "value_path": "C",
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


if __name__ == "__main__":
    generate_if_missing(Path(__file__).parent / OUTPUT_FILENAME, build)
