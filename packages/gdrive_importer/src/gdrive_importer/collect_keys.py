from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from utils import collect_keys

all_keys: dict[str, set[str]] = defaultdict(set)
root = Path(__file__).parents[2]
for json_file in (root / "json_data").rglob("*.json"):
    data = json.loads(json_file.read_text())
    collect_keys(data, keys=all_keys)
for key in sorted(all_keys):
    print(key)
