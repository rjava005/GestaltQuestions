from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from utils import collect_keys

all_keys: dict[str, set[str]] = defaultdict(set)
all_qtypes = set()
root = Path(__file__).parents[2]
for json_file in (root / "json_data").rglob("*.json"):
    data = json.loads(json_file.read_text())
    qtypes = data.get("qType", None)
    if qtypes:
        all_qtypes.add(qtypes)
    collect_keys(data, keys=all_keys)
# for key in sorted(all_keys):
#     print(key)
