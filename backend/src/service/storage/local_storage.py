import shutil
from pathlib import Path
from typing import List, Literal, Sequence, cast

from google.cloud.storage.blob import Blob

from src.app_types.general import STORAGE_TYPE
from src.core.logging import logger

from .base import Storage


class LocalStorage(Storage):
    def __init__(self):
        self.set_storage_type()

    def set_storage_type(self) -> Literal["cloud"] | Literal["local"]:
        self.mode = "local"
        return "local"

    def get_storage_type(self) -> Literal["cloud"] | Literal["local"]:
        return cast(STORAGE_TYPE, self.mode)

    def _resolve(self, target: str) -> Path:
        return Path(self._to_storage_path(target)).resolve()

    def exists(self, target: str | Path | Blob) -> bool:
        storage_path = self._to_storage_path(target)
        return self._resolve(storage_path).exists()

    def is_dir(self, target: str) -> bool:
        return Path(target).is_dir()

    def create_dir(self, target: str) -> str:
        storage_path = self._to_storage_path(target)
        path = self._resolve(storage_path)
        if path.is_file():
            raise ValueError("Cannot create directory. Received file")
        path.mkdir(parents=True, exist_ok=True)
        return path.as_posix()

    def read(self, target: str | Path | Blob) -> bytes | None:
        storage_path = self._to_storage_path(target)
        path = self._resolve(storage_path)
        return path.read_bytes()

    def write(
        self,
        target: str,
        data: str | dict | List | bytes | bytearray,
        *,
        overwrite: bool = True,
    ) -> str:
        storage_path = self._to_storage_path(target)
        path = self._resolve(storage_path)

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(self._normalize_content(data))
        return storage_path

    def download(self, target: str) -> bytes:
        raise NotImplementedError("Cannot download question not implemented")

    def delete(self, target: str | Path | Blob) -> None:
        storage_path = self._to_storage_path(target)
        path = self._resolve(storage_path)
        if path.is_file():
            path.unlink()
        elif path.is_dir():
            shutil.rmtree(path)

    def list(self, target: str, *, recursive: bool = False) -> Sequence[str]:
        storage_path = self._to_storage_path(target)
        base = self._resolve(storage_path)

        if not base.exists():
            return []

        iterator = base.rglob("*") if recursive else base.glob("*")
        results = []
        for path in iterator:
            if path.is_file():
                results.append(self._to_storage_path(path))
        return results

    def move(self, source: str, destination: str) -> str:
        # Probably redundatn but ensure we have the path
        src_path = self._resolve(self._to_storage_path(source))
        new_dest = self.copy(source, destination)

        self.delete(src_path)
        return str(new_dest)

    def copy(
        self,
        source: str,
        destination: str,
    ) -> str:

        src_path = self._resolve(self._to_storage_path(source))
        dst_storage = self._to_storage_path(destination)

        if not src_path.exists():
            raise FileExistsError(f"Source path does not exist {src_path}")

        dst_path = self._resolve(dst_storage)
        logger.info(f"Copying data, {src_path}->{dst_path}")

        if src_path.is_dir():
            logger.info("Received a directory")
            # Copy directory recursively
            shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
        elif src_path.is_file():
            logger.info("Received a file")
            # Ensure parent exists
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_path, dst_path)

        else:
            raise ValueError(
                f"Failed to move file received {src_path} cannot determine path"
            )

        return str(dst_storage)
