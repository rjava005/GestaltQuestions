import json
from collections import defaultdict
from pathlib import Path

from gdrive_indexer import GDriveFile, GoogleDriveIndexer

root = Path(__file__).parents[2]

cred_path = root / "credentials.json"
token_path = root / "token.json"

indexer = GoogleDriveIndexer(cred_path, token_path)
service = indexer.get_service()

data_path = root / "data.json"
json_path = root / "html_data"
json_path.mkdir(exist_ok=True)
parent_dict = defaultdict(list)
statics_folder = "1XJp7G0n7SQFtV8CDggO82V4V_09LpIiC"
data = [GDriveFile.model_validate(f) for f in json.loads(data_path.read_text())]

for item in data:
    if (
        item.mimeType == "application/vnd.google-apps.folder"
        and item.name != "clientFilesQuestion"
    ):
        continue

    parent_id = item.parents[0]

    if parent_id == statics_folder:
        continue

    parent_dict[parent_id].append(item)

for parent_id, files in parent_dict.items():

    for file in files:
        # print(f"  - {file.name} ({file.id})")
        if file.name == "question.html":
            data = indexer.read_file(file.id).decode("utf-8")
            p = json_path / f"{parent_id[:8]}.html"
            p.write_text(data)
