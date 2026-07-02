from datetime import date, datetime, time
from pathlib import Path
from typing import Any
from uuid import UUID

from langchain.messages import AIMessage
from pydantic import BaseModel


def to_serializable(obj: Any) -> Any:
    """Recursively convert Pydantic models (and nested dicts/lists thereof)
    into plain Python data structures.
    """
    if isinstance(obj, BaseModel):
        return obj.model_dump()
    if isinstance(obj, dict):
        return {k: to_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_serializable(v) for v in obj]

    # --- Special cases ---
    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Path):
        return obj.as_posix()

    return obj


def save_graph(graph, save_path: Path | str):
    png_data = graph.get_graph().draw_mermaid_png()
    with open(save_path, "wb") as f:
        f.write(png_data)


def load_prompt(filename: str) -> str:
    path = (Path("prompts") / filename).resolve()
    if not path.exists():
        raise ValueError(
            f"Failed to load prompt {filename} path {path} cannot be resolved"
        )
    return path.read_text()


def get_image_base64(response: AIMessage) -> None:
    image_block = next(
        block
        for block in response.content
        if isinstance(block, dict) and block.get("image_url")
    )
    return image_block["image_url"].get("url").split(",")[-1]
