import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Sequence, Union

from google.cloud.storage.blob import Blob

from src.app_types.general import STORAGE_TYPE


class Storage(ABC):
    """
    Abstract interface for a storage backend.

    Implementations may target:
        - Local filesystem
        - Cloud object storage (GCS, S3, Azure)
        - Hybrid or in-memory storage

    The interface is intentionally backend-agnostic and avoids
    filesystem-specific assumptions such as true directory creation.
    """

    # ---------------------------------------------------------
    # Core file operations
    # ---------------------------------------------------------

    @abstractmethod
    def set_storage_type(self) -> STORAGE_TYPE:
        """Set the storage type for the given target .

        Raises:
            ValueError: [description]
            TypeError: [description]
            ValueError: [description]

        Returns:
            STORAGE_TYPE: [description]
        """

    @abstractmethod
    def get_storage_type(self) -> STORAGE_TYPE:
        """Get the storage type for the given target .

        Raises:
            ValueError: [description]
            TypeError: [description]
            ValueError: [description]

        Returns:
            STORAGE_TYPE: [description]
        """

    @abstractmethod
    def exists(self, target: str) -> bool:
        """
        Return True if the given target exists in storage.

        Args:
            target: A normalized storage path or key.

        Returns:
            bool indicating existence.
        """
        ...

    @abstractmethod
    def is_dir(self, target: str) -> bool:
        """
        Return True if the given target represents a directory/prefix.

        Args:
            target: A normalized storage path or key.

        Returns:
            bool indicating whether the target is a directory.
        """

    @abstractmethod
    def create_dir(self, target: str) -> str:
        """Create a new directory under the given path .

        Args:
            target (TARGET): A str, path, or blob

        Raises:
            ValueError: [description]
            TypeError: [description]
            ValueError: [description]

        Returns:
            TARGET: The name of the dir
        """

    @abstractmethod
    def read(self, target: str) -> bytes | None:
        """
        Read the contents of a stored object.

        Args:
            target: The storage path/key to read.

        Returns:
            Raw bytes of the stored object.

        Raises:
            FileNotFoundError if target does not exist.
        """
        ...

    @abstractmethod
    def write(
        self,
        target: str,
        data: str | dict | List | bytes | bytearray,
        *,
        overwrite: bool = True,
    ) -> str:
        """
        Write raw bytes to the given storage target.

        Args:
            target: The storage path/key to write to.
            data: Raw bytes to store.
            overwrite: Whether to overwrite existing content.

        Returns:
            The normalized storage target.

        Raises:
            FileExistsError if overwrite=False and target exists.
        """
        ...

    @abstractmethod
    def delete(self, target: str) -> None:
        """
        Delete the specified storage target.

        Args:
            target: The storage path/key to delete.

        Raises:
            FileNotFoundError if target does not exist.
        """
        ...

    @abstractmethod
    def download(self, target: str) -> bytes:
        """
        Download and return the raw bytes for the specified storage target.

        Args:
            target: The storage path/key to download.

        Returns:
            Raw bytes of the downloaded object.

        Raises:
            FileNotFoundError if target does not exist.
        """
        ...

    # ---------------------------------------------------------
    # Directory / prefix operations
    # ---------------------------------------------------------

    @abstractmethod
    def list(self, target: str, *, recursive: bool = False) -> Sequence[str]:
        """
        List objects under a given prefix or directory.

        Args:
            target: Directory or prefix to list.
            recursive: If True, include nested objects.

        Returns:
            Sequence of storage targets.
        """
        ...

    # ---------------------------------------------------------
    # Object management operations
    # ---------------------------------------------------------

    @abstractmethod
    def copy(self, source: str, destination: str) -> str:
        """
        Copy an object from source to destination.

        Args:
            source: Existing storage target.
            destination: New storage target.

        Returns:
            The destination target.
        """
        ...

    @abstractmethod
    def move(self, source: str, destination: str) -> str:
        """
        Move (rename) an object from source to destination.

        Implementations for object storage may internally
        perform copy + delete.

        Args:
            source: Existing storage target.
            destination: New storage target.

        Returns:
            The destination target.
        """
        ...

    def _to_storage_path(self, value: Union[str, Path, Blob]) -> str:
        """
        Normalize input into a StoragePath.

        Accepts:
            - str
            - pathlib.Path
            - StoragePath

        Returns:
            StoragePath (normalized).
        """
        if isinstance(value, str):
            return Path(value).as_posix()
        if isinstance(value, Path):
            return value.as_posix()
        if isinstance(value, Blob):
            if not value.name:
                raise ValueError(f"Cannot determine blob: {value}")
            return Path(value.name).as_posix()

        raise TypeError(f"Unsupported path type: {type(value)}")

    def _normalize_content(
        self, content: str | dict | List | bytes | bytearray
    ) -> bytes:
        # Normalize content
        if isinstance(content, (dict, list)):
            content_bytes = json.dumps(content, indent=2).encode("utf-8")

        elif isinstance(content, str):
            content_bytes = content.encode("utf-8")

        elif isinstance(content, (bytes, bytearray)):
            content_bytes = bytes(content)

        else:
            raise ValueError(f"Unsupported content type: {type(content)}")
        return content_bytes
