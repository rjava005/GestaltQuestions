from __future__ import annotations

import json
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.storage.schema import FileData


def prepare_file_uploads(file_data: list[FileData]):
    """
    Convert a list of FileData objects into tuples compatible with FastAPI's
    `files` parameter in `TestClient.post`.

    Each FileData is transformed into:
        ("files", (filename, content, content_type))

    - Dict content → JSON string with "application/json"
    - Bytes/bytearray content → binary with "application/octet-stream"
    - String content → plain text with "text/plain"

    Args:
        file_data (List[FileData]): List of FileData objects.

    Returns:
        list[tuple[str, tuple[str, Any, str]]]: Upload-ready tuples.
    """
    files = []
    for f in file_data:
        if isinstance(f.content, dict):
            content = json.dumps(f.content)
            content_type = "application/json"
        elif isinstance(f.content, (bytes, bytearray)):
            content = f.content
            content_type = "application/octet-stream"
        else:  # assume str
            content = f.content
            content_type = "text/plain"

        files.append(("files", (f.filename, content, content_type)))
    return files
