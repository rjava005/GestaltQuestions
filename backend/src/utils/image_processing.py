import base64
from pathlib import Path
from typing import Optional, Any


def encode_image(image_path: str | Path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def handle_image_data(data) -> bytes:
    try:
        if isinstance(data, list):
            image_data = data[0]
            return base64.b64decode(image_data)
        else:
            raise NotImplemented
    except Exception as e:
        raise e


def write_image_data(image_bytes: bytes, folder_path: str | Path, filename: str) -> str:
    try:
        path = Path(folder_path).resolve()
        path.mkdir(exist_ok=True)
        save_path = path / filename

        if save_path.suffix != ".png":
            raise ValueError(
                "Suffix allowed is only PNG either missing or nnot allowed"
            )
        save_path.write_bytes(image_bytes)
        return save_path.as_posix()
    except Exception as e:
        raise ValueError(f"Could not save image {str(e)}")


