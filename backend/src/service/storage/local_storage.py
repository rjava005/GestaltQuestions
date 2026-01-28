# --- Standard Library ---
import json
from pathlib import Path
from typing import IO, List, Union
import shutil

# --- Internal ---
from .base import StorageService
from src.core import logger
from google.cloud.storage.blob import Blob


class LocalStorageService(StorageService):
    """
    Local storage implementation of `StorageService`.

    and download operations.
    """

    # -------------------------------------------------------------------------
    # Initialization / Lifecycle
    # -------------------------------------------------------------------------

    def __init__(self, root_path: str | Path, base: str, create: bool = True):
        """
        Initialize the local storage service with a base_path directory.

        Args:
            _root_path: Path or string specifying the _root_path storage directory.
        """
        self._root_path = Path(root_path).resolve()
        self.base_path = (self._root_path / base).resolve()
        # The actual name of where the data is stored
        self.base = base
        # Ensure that the storage is created
        if create:
            self._root_path.mkdir(parents=True, exist_ok=True)
        logger.debug(
            f"Initialized the storage, questions will be stored at {self.base_path}"
        )

    # -------------------------------------------------------------------------
    # base_path path operations
    # -------------------------------------------------------------------------

    def get_base_path(self) -> str:
        """
        Return the absolute path to the base_path directory for local storage.

        Returns:
            Path: The resolved base_path directory path.
        """
        return Path(self.base_path).as_posix()

    def get_root_path(self) -> str:
        """Returns the _root_path path"""
        return self._root_path.as_posix()

    def get_relative_to_base(self, target: str | Path | Blob) -> str:
        if isinstance(target, Blob):
            target = str(target.name)
        # Convert to Path
        target_path = Path(target)

        # Case 1: Absolute path inside the storage _root_path
        try:
            relative_path = target_path.relative_to(self._root_path)
            logger.debug("Retrieved relative path fine %s", relative_path)
        except ValueError:
            # Case 2: Not inside _root_path (likely already relative or external)
            relative_path = target_path

        # Convert to posix string
        rel_str = relative_path.as_posix().lstrip("/")

        # 1. Avoid duplication
        base = self.base
        if rel_str == base:
            return rel_str

        # 2.  If rel_str starts with "questions/", do NOT prefix
        if rel_str.startswith(f"{base}/"):
            return rel_str
        # Case 3: Ensure prefix, if it does not start
        if not rel_str.startswith(f"{self.base}/"):
            rel_str = f"{self.base}/{rel_str}"

        return rel_str

    # =========================================================================
    # Storage path operations
    # =========================================================================
    def get_storage_path(self, target: str | Path | Blob, relative: bool = True) -> str:
        """
        Build the absolute path for a resource based on its identifier.

        Args:
            identifier: Unique identifier for the stored resource.

        Returns:
            Path: Path to the resource directory.
        """
        rel_str = self.get_relative_to_base(target)
        logger.debug("This is the rel str %s", rel_str)
        if relative:
            return rel_str
        absolute_path = Path(self._root_path) / rel_str
        return absolute_path.as_posix()

    def create_storage_path(self, target: str | Path) -> str:
        """
        Create a directory for the given identifier if it does not exist.

        Args:
            identifier: Unique identifier for the stored resource.

        Returns:
            Path: Path to the created directory.
        """
        storage = Path(self.get_storage_path(target, relative=False))
        storage.mkdir(parents=True, exist_ok=True)
        return storage.as_posix()

    def ensure_storage_path(self, target: str | Path) -> str:
        if not self.does_storage_path_exist(target):
            logger.debug("Storage Path does not exist creating one ")
            return self.create_storage_path(target)
        logger.debug("Storage path exist")
        return self.get_storage_path(target, relative=False)

    def does_storage_path_exist(self, target: str | Path) -> bool:
        """
        Check if a directory exists for a given identifier.

        Args:
            identifier: Unique identifier for the stored resource.

        Returns:
            bool: True if the directory exists, False otherwise.
        """
        return Path(self.get_storage_path(target, relative=False)).exists()

    def rename_storage(self, old: str | Path, new: str | Path) -> str:
        old = Path(old)
        new = Path(new)

        logger.debug(f"[LocalStorage]: Renaming {old}->{new}")

        if not old.is_absolute():
            old = self.get_storage_path(old, relative=False)
        if not new.is_absolute():
            new = self.get_storage_path(new, relative=False)

        Path(old).rename(new)
        return Path(new).as_posix()

    # =========================================================================
    # File operations: read, write, fetch
    # =========================================================================

    def read_file(
        self, target: str | Path, filename: str | None = None
    ) -> bytes | None:
        """
        Retrieve a file's contents by its identifier and filename.

        Args:
            identifier: Unique identifier for the stored resource.
            filename: Name of the file.

        Returns:
            bytes | None: File contents if found, otherwise None.
        """
        target = Path(self.get_file_path(target, filename))

        if target.exists() and target.is_file():
            return target.read_bytes()
        return None

    def download_file(
        self, target: str | Path, filename: str | None = None
    ) -> bytes | None:
        return self.read_file(target, filename)

    def get_file_path(self, target: str | Path, filename: str | None = None) -> str:
        target = Path(self.get_storage_path(target, relative=False))
        if filename:
            target = target / filename
            return target.as_posix()
        else:
            return target.as_posix()

    def open_file_stream(self, target: str | Path, filename: str) -> IO[bytes]:
        return super().open_file_stream(target, filename)

    def upload_file(
        self,
        file_obj: IO[bytes],
        target: str | Path,
        filename: str | None = None,
        content_type: str = "application/octet-stream",
    ) -> Blob | Path:
        self.get_file_path(target, filename)
        if isinstance(file_obj, bytes):
            return self.save_file(target, file_obj, filename)
        else:
            try:
                file_obj.seek(0)
            except Exception:
                pass  # not all IO objects support seek
        return self.save_file(target, file_obj.read(), filename)

    def get_file(
        self, target: str | Path, filename: str | None = None, recursive: bool = False
    ) -> str:
        """
        Build the absolute file path for a given identifier and filename.

        Args:
            identifier: Unique identifier for the stored resource.
            filename: Name of the file.

        Returns:
            Path: Full path to the file.
        """
        if filename:
            path = Path(self.get_storage_path(target, relative=False)) / filename
            return path.as_posix()

        else:
            return self.get_storage_path(target)

    def save_file(
        self,
        target: str | Path,
        content: Union[str, dict, list, bytes, bytearray],
        filename: str | None = None,
        overwrite: bool = True,
    ) -> Path:
        """
        Save a file to the given target directory.

        Args:
            target: Directory to save into. Can be absolute or relative.
            filename: Target filename.
            content: Content to write.
            overwrite: Whether to overwrite an existing file.

        Returns:
            Path: The full path to the saved file.
        """
        if filename:
            target = Path(self.get_storage_path(target, relative=False))
            target.mkdir(parents=True, exist_ok=True)
            file_path = (Path(target) / filename).resolve()
        else:
            file_path = Path(target).resolve()
            file_path.parent.mkdir(parents=True, exist_ok=True)

        # Handle overwrite rules
        if not overwrite and file_path.exists():
            raise ValueError(f"Cannot overwrite file: {file_path}")

        # --- Write depending on content type ---
        if isinstance(content, (dict, list)):
            file_path.write_text(json.dumps(content, indent=2))

        elif isinstance(content, (bytes, bytearray)):
            mode = "wb"
            with open(file_path, mode) as f:
                f.write(content)

        else:
            logger.debug("Saving text %s to path %s", content, file_path)
            file_path.write_text(str(content))

        return file_path

    # =========================================================================
    # Metadata operations
    # =========================================================================
    def get_metadata(self, target: str | Path, filename: str | None = None) -> dict:
        """
        Return metadata for a file (size, checksum, timestamps, etc.).
        Cloud providers typically return a rich metadata object.
        """
        raise NotImplementedError

    def get_public_url(
        self, target: str | Path, filename: str | None = None, expires_in: int = 3600
    ) -> str:
        return super().get_public_url(target, filename, expires_in)

    # =========================================================================
    # File listing, checks, existence
    # =========================================================================

    def list_file_names(self, target: str | Path) -> List[str]:
        return [Path(f).name for f in self.list_file_paths(target) if Path(f).is_file()]

    def list_file_paths(self, target: str | Path, recursive: bool = False) -> List[str]:
        target = Path(self.get_storage_path(target, relative=False))
        if not target.exists():
            logger.warning(f"Target path does not exist for {target}")
            return []
        if recursive:
            return [f.as_posix() for f in target.rglob("*")]
        else:
            return [f.as_posix() for f in target.iterdir()]

    def does_file_exist(self, target: str | Path, filename: str | None = None) -> bool:
        return super().does_file_exist(target, filename)

    def iterate(self, target: str | Path, recursive: bool = False):
        target_path = Path(self.get_storage_path(target, relative=False))
        return target_path.rglob("*") if recursive else target_path.iterdir()

    # =========================================================================
    # Mutating operations: copy, move, delete
    # =========================================================================
    def copy_file(
        self,
        source_target: str | Path,
        source_filename: str,
        dest_target: str | Path,
        dest_filename: str | None = None,
    ) -> Path | Blob:
        return super().copy_file(
            source_target, source_filename, dest_target, dest_filename
        )

    def move_file(
        self,
        source_target: str | Path,
        source_filename: str,
        dest_target: str | Path,
        dest_filename: str | None = None,
    ) -> Path | Blob:
        return super().move_file(
            source_target, source_filename, dest_target, dest_filename
        )

    def delete_file(self, target: str | Path, filename: str | None = None) -> None:
        """
        Delete a specific file within a resource directory.

        Args:
            identifier: Unique identifier for the stored resource.
            filename: Name of the file to delete.
        """
        target = Path(self.get_file_path(target, filename))
        logger.debug(f"[LOCAL STORAGE] Attempting to delete [target]: {target}")
        if target and target.exists():
            logger.debug(f"[LOCAL STORAGE] Deleting file {target}")
            target.unlink()
        else:
            logger.warning("File does not exist")

    def delete_storage(self, target: str | Path) -> None:
        """
        Delete a storage directory and all its contents.

        Args:
            identifier: Unique identifier for the stored resource.
        """
        target = Path(self.get_storage_path(target))
        logger.debug(f"Target to delete {target}")
        if target.exists():
            for f in target.iterdir():
                if f.is_file():
                    f.unlink()
            shutil.rmtree(target)

    def hard_delete(self) -> None:
        target = Path(self.get_base_path())
        if target.exists():
            for f in target.iterdir():
                if f.is_file():
                    f.unlink()
            shutil.rmtree(target)
