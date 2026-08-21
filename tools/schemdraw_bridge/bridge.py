"""Turn a SchemDraw drawing into an authored Gestalt visual definition.

SchemDraw is used here as a *layout solver*, not as a renderer. The author
describes connectivity with SchemDraw's chaining API, SchemDraw computes where
everything sits, and this module reads the resulting absolute anchors back out
and writes a normal ``block-diagram.json`` / ``circuit.json``.

That keeps the platform invariant intact: the coordinates in the file are still
the coordinates on screen, the runtime renderer is unchanged, and the emitted
file stays hand-editable in the visual editor afterwards. Nothing here runs in
the backend or the sandbox -- it is an authoring aid.

SchemDraw's Y axis points up and ours points down, so every extracted point is
flipped and rescaled into the viewBox below.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

import schemdraw

# One SchemDraw unit -> this many SVG units. A dsp.Box(w=2) becomes 120 wide,
# which matches the renderer's default block width closely enough to look
# native next to hand-authored diagrams.
SCALE = 60.0
GRID = 20
MARGIN = 40


def _snap(value: float) -> int:
    """Round onto the editor's grid so generated files stay nudgeable."""
    return int(round(value / GRID) * GRID)


@dataclass
class _Transform:
    """Maps SchemDraw coordinates into the emitted viewBox."""

    xmin: float
    ymax: float

    def point(self, xy: Any) -> list[int]:
        x, y = float(xy[0]), float(xy[1])
        return [
            _snap((x - self.xmin) * SCALE + MARGIN),
            _snap((self.ymax - y) * SCALE + MARGIN),
        ]


@dataclass
class BlockDiagramBuilder:
    """Collects tagged SchemDraw elements and emits a block-diagram definition."""

    aria_label: str
    _nodes: list[tuple[Any, dict[str, Any]]] = field(default_factory=list)
    _wires: list[tuple[Any, dict[str, Any]]] = field(default_factory=list)
    _slots: list[dict[str, Any]] = field(default_factory=list)

    def node(
        self,
        drawing: schemdraw.Drawing,
        element: Any,
        *,
        id: str,
        type: str,
        label: str | None = None,
        value_path: str | None = None,
        signs: str | None = None,
    ):
        """Add an element to the drawing and tag it as one of our nodes."""
        placed = drawing.add(element)
        self._nodes.append(
            (
                placed,
                {
                    "id": id,
                    "type": type,
                    "label": label,
                    "value_path": value_path,
                    "signs": signs,
                },
            )
        )
        return placed

    def wire(
        self,
        drawing: schemdraw.Drawing,
        element: Any,
        *,
        label: str | None = None,
        feedback: bool = False,
    ):
        """Add a connecting element whose endpoints become a wire polyline."""
        placed = drawing.add(element)
        self._wires.append((placed, {"label": label, "feedback": feedback}))
        return placed

    def answer_slot(
        self,
        anchor: Any,
        *,
        id: str,
        answer_name: str,
        kind: Literal["numeric", "math"] = "numeric",
        label: str | None = None,
        width: int = 140,
        height: int = 70,
        offset: tuple[float, float] = (0.0, 0.0),
    ) -> None:
        """Reserve an answer block centred on a SchemDraw anchor.

        Offsets are in SchemDraw units so authors can push the slot clear of the
        geometry -- the renderer will not move it for them.
        """
        self._slots.append(
            {
                "id": id,
                "answerName": answer_name,
                "kind": kind,
                "label": label,
                "width": width,
                "height": height,
                "_anchor": anchor,
                "_offset": offset,
            }
        )

    def build(self, drawing: schemdraw.Drawing) -> dict[str, Any]:
        bbox = drawing.get_bbox()
        transform = _Transform(xmin=bbox.xmin, ymax=bbox.ymax)
        width = _snap((bbox.xmax - bbox.xmin) * SCALE + 2 * MARGIN)
        height = _snap((bbox.ymax - bbox.ymin) * SCALE + 2 * MARGIN)

        # Continuous anchor coordinate -> already-derived port coordinate, kept
        # per axis rather than per point. A routed wire often turns a corner
        # away from any node (e.g. a feedback path that drops, runs sideways,
        # then rises into a port): that corner shares only one coordinate with
        # the node it is ultimately headed for, not the full point, so an
        # x/y-only match is what lets the whole run resolve consistently.
        #
        # Re-snapping a wire endpoint independently, instead of reusing the
        # node's own derived coordinate, is not merely redundant -- it is
        # wrong in a specific, reproducible case: a node's centre can land
        # exactly halfway between two grid lines (e.g. a circle whose radius
        # is an odd multiple of half the grid unit). That is a genuine tie
        # with no correct rounding -- Python's round() breaks it toward the
        # nearest even multiple, which need not match the position implied by
        # the node's own edges. A wire built from that same raw centre value
        # hits the identical tie and can break it the other way, landing a
        # full grid step off from a port that is otherwise rendered
        # correctly, which is what produced a visibly tilted feedback wire
        # here. Reusing the node's already-decided coordinate sidesteps the
        # tie rather than trying to predict which way it breaks.
        x_lookup: list[tuple[float, int]] = []
        y_lookup: list[tuple[float, int]] = []

        nodes: list[dict[str, Any]] = []
        for element, meta in self._nodes:
            anchors = element.absanchors
            node: dict[str, Any] = {"id": meta["id"], "type": meta["type"]}
            # Derive the centre from the *snapped* edge anchors rather than
            # snapping the centre separately. Snapping each independently lets
            # them disagree by up to half a grid step, which shows up as wires
            # stopping short of the block they connect to.
            if "W" in anchors and "E" in anchors:
                west = transform.point(anchors["W"])
                east = transform.point(anchors["E"])
                node["at"] = [(west[0] + east[0]) // 2, (west[1] + east[1]) // 2]
                node["width"] = max(GRID, abs(east[0] - west[0]))
                # N/S give the block's height only. They must not move the
                # centre: W and E already sit on the element's centre line,
                # which is exactly where wires attach, and N/S can snap
                # asymmetrically about it.
                if "N" in anchors and "S" in anchors:
                    north = transform.point(anchors["N"])
                    south = transform.point(anchors["S"])
                    node["height"] = max(GRID, abs(south[1] - north[1]))
            else:
                node["at"] = transform.point(
                    anchors.get("center", anchors.get("xy"))
                )
            if meta["label"]:
                node["label"] = meta["label"]
            if meta["signs"]:
                node["signs"] = meta["signs"]
            if meta["value_path"]:
                node["value"] = {"path": meta["value_path"], "significantDigits": 3}
            nodes.append(node)

            at = node["at"]
            half_w = node.get("width", 0) // 2
            half_h = node.get("height", 0) // 2
            for anchor_name, port_x, port_y in (
                ("W", at[0] - half_w, at[1]),
                ("E", at[0] + half_w, at[1]),
                ("N", at[0], at[1] - half_h),
                ("S", at[0], at[1] + half_h),
                ("center", at[0], at[1]),
                ("xy", at[0], at[1]),
            ):
                raw = anchors.get(anchor_name)
                if raw is None:
                    continue
                x_lookup.append((float(raw[0]), port_x))
                y_lookup.append((float(raw[1]), port_y))

        def _resolve_axis(raw_value: float, lookup: list[tuple[float, int]]) -> int | None:
            for raw_anchor, resolved in lookup:
                if abs(raw_anchor - raw_value) < 1e-6:
                    return resolved
            return None

        def _resolve(raw_point: Any) -> list[int]:
            snapped = transform.point(raw_point)
            x = _resolve_axis(float(raw_point[0]), x_lookup)
            y = _resolve_axis(float(raw_point[1]), y_lookup)
            return [x if x is not None else snapped[0], y if y is not None else snapped[1]]

        wires: list[dict[str, Any]] = []
        for element, meta in self._wires:
            anchors = element.absanchors
            start, end = anchors.get("start"), anchors.get("end")
            if start is None or end is None:
                continue
            points = [_resolve(start), _resolve(end)]
            if points[0] == points[1]:
                continue
            wire: dict[str, Any] = {"points": points}
            if meta["label"]:
                wire["label"] = meta["label"]
            if meta["feedback"]:
                wire["feedback"] = True
            wires.append(wire)

        slots: list[dict[str, Any]] = []
        for slot in self._slots:
            anchor = slot["_anchor"]
            dx, dy = slot["_offset"]
            at = transform.point((float(anchor[0]) + dx, float(anchor[1]) + dy))
            emitted = {
                "id": slot["id"],
                "answerName": slot["answerName"],
                "at": at,
                "width": slot["width"],
                "height": slot["height"],
                "kind": slot["kind"],
            }
            if slot["label"]:
                emitted["label"] = slot["label"]
            slots.append(emitted)

        # Answer blocks are part of the drawing's extent. SchemDraw's bbox knows
        # nothing about them, so grow the viewBox (and shift everything if a slot
        # sits above or left of the origin) rather than emitting a clipped file.
        min_x = min([0, *(s["at"][0] - s["width"] // 2 for s in slots)])
        min_y = min([0, *(s["at"][1] - s["height"] // 2 for s in slots)])
        shift_x = _snap(MARGIN - min_x) if min_x < 0 else 0
        shift_y = _snap(MARGIN - min_y) if min_y < 0 else 0
        if shift_x or shift_y:
            for node in nodes:
                node["at"] = [node["at"][0] + shift_x, node["at"][1] + shift_y]
            for wire in wires:
                wire["points"] = [
                    [p[0] + shift_x, p[1] + shift_y] for p in wire["points"]
                ]
            for slot in slots:
                slot["at"] = [slot["at"][0] + shift_x, slot["at"][1] + shift_y]
        width = max(
            width + shift_x,
            *(s["at"][0] + s["width"] // 2 + MARGIN for s in slots),
        ) if slots else width + shift_x
        height = max(
            height + shift_y,
            *(s["at"][1] + s["height"] // 2 + MARGIN for s in slots),
        ) if slots else height + shift_y

        definition: dict[str, Any] = {
            "version": 1,
            "ariaLabel": self.aria_label,
            "viewBox": [0, 0, _snap(width), _snap(height)],
            "nodes": nodes,
            "wires": wires,
        }
        if slots:
            definition["answerSlots"] = slots
        return definition


def extract_circuit(
    drawing: schemdraw.Drawing,
    tagged: list[tuple[Any, dict[str, Any]]],
    *,
    aria_label: str,
    wires: list[Any] | None = None,
) -> dict[str, Any]:
    """Emit a circuit.json scene from tagged two-terminal SchemDraw elements."""
    bbox = drawing.get_bbox()
    transform = _Transform(xmin=bbox.xmin, ymax=bbox.ymax)

    elements: list[dict[str, Any]] = []
    for element, meta in tagged:
        anchors = element.absanchors
        entry: dict[str, Any] = {
            "id": meta["id"],
            "type": meta["type"],
            "from": transform.point(anchors["start"]),
            "to": transform.point(anchors["end"]),
        }
        if meta.get("label"):
            entry["label"] = meta["label"]
        if meta.get("value_path"):
            entry["value"] = {
                "path": meta["value_path"],
                "sourceUnit": meta.get("unit"),
                "significantDigits": 3,
            }
        elements.append(entry)

    polylines: list[dict[str, Any]] = []
    for element in wires or []:
        anchors = element.absanchors
        points = [transform.point(anchors["start"]), transform.point(anchors["end"])]
        if points[0] != points[1]:
            polylines.append({"points": points})

    return {
        "version": 1,
        "ariaLabel": aria_label,
        "viewBox": [
            0,
            0,
            _snap((bbox.xmax - bbox.xmin) * SCALE + 2 * MARGIN),
            _snap((bbox.ymax - bbox.ymin) * SCALE + 2 * MARGIN),
        ],
        "wires": polylines,
        "elements": elements,
        "annotations": [],
    }


def write_json(definition: dict[str, Any], path: str | Path) -> Path:
    target = Path(path)
    target.write_text(json.dumps(definition, indent=2) + "\n", encoding="utf-8")
    return target
