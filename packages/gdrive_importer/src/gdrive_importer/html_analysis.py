from collections import defaultdict
from pathlib import Path

from bs4 import BeautifulSoup

root = Path(__file__).parents[2]
html_folder = root / "html_data"


# Creates a dict
#  Structure: {tag_name: set(attributes)}
#
#
attributes_by_tag = defaultdict(set)


for html in html_folder.rglob("*.html"):
    f = html.read_text(encoding="utf-8")
    soup = BeautifulSoup(f, "html.parser")
    for tag in soup.find_all(True):
        attributes_by_tag[tag.name].update(tag.attrs.keys())
for key, value in attributes_by_tag.items():
    pass
