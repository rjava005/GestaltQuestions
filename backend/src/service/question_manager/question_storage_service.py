import base64
import mimetypes
from pathlib import Path, PurePosixPath
from typing import Any, List, Sequence

from google.cloud.storage.blob import Blob

from src.core.logging import logger
from src.model.files import FileData
from src.service.storage.base import Storage


class InvalidQuestionFile(Exception):
    pass


class QuestionStorageService:
    """Handles file storage operations for questions.

    This service abstracts storage operations and path normalization,
    keeping QuestionManager clean. It provides a consistent interface
    for reading, writing, deleting, and batch saving files.
    """

    def __init__(self, storage: Storage):
        """Initialize the storage service.

        Args:
            storage (Storage): Storage backend instance (cloud or local)
        """
        self.storage = storage
        logger.debug(
            "QuestionStorageService initialized with %s",
            storage.__class__.__name__,
        )

    # Core Operations

    def read_file(self, dir_path: str, *, filename: str | None = None) -> bytes | None:
        """Read a file from storage.

        Args:
            dir_path (str): Directory path where the file is located
            filename (str | None): Optional filename. If provided, reads that specific file.
            If None, treats dir_path as full file path.

        Returns:
            bytes | None: File content as bytes, or None if file doesn't exist
        """
        file = self._construct_file_path(dir_path, filename=filename)
        logger.debug("Reading question file %s", file)
        return self.storage.read(file)

    def write_file(self, dir_path: str, data: Any, *, filename: str | None = None):
        """Write data to storage.

        Args:
            dir_path (str): Directory path where the file will be saved
            data (Any): Content to write (str, bytes, dict, etc.)
            filename (str | None): Optional filename. If provided, writes to dir_path/filename.
            If None, treats dir_path as full file path.

        Returns:
            str: Path where file was written
        """
        file = self._construct_file_path(dir_path, filename=filename)
        written_path = self.storage.write(file, data)
        logger.info("Wrote question file %s", written_path)
        return written_path

    def delete_file(self, dir_path: str, *, filename: str | None = None) -> None:
        """Delete a file from storage.

        Args:
            dir_path (str): Directory path containing the file
            filename (str | None): Optional filename. If provided, deletes dir_path/filename.
            If None, treats dir_path as full file path.
        """
        file = self._construct_file_path(dir_path, filename=filename)
        logger.info("Deleting question file %s", file)
        self.storage.delete(file)

    def delete_dir(self, dir_path: str) -> None:
        """Delete an entire directory and its contents from storage.

        Args:
            dir_path (str): Directory path to delete
        """
        logger.info("Deleting question storage directory %s", dir_path)
        self.storage.delete(dir_path)

    def list_files(self, dir_path: str, *, recursive: bool = False) -> Sequence[str]:
        """List all files in a directory.

        Args:
            dir_path (str): Directory path to list files from

        Returns:
            Sequence[str]: List of file paths in the directory
        """
        normalized_path = self._norm_path(dir_path)
        files = [str(p) for p in self.storage.list(normalized_path, recursive=recursive)]
        logger.debug("Listed %s question files under %s", len(files), normalized_path)
        return files

    def batch_save_files(self, dir_path: str, files: List[FileData]) -> List[str]:
        """Save multiple files to storage in batch.

        Args:
            dir_path (str): Directory path where files will be saved
            files (List[FileData]): List of FileData objects to save

        Returns:
            List[str]: List of paths where files were saved
        """
        targets = []
        logger.debug("Batch saving %s question files under %s", len(files), dir_path)
        for f in files:
            self.write_file(dir_path, data=f.content, filename=f.filename)
            targets.append(self._construct_file_path(dir_path, filename=f.filename))
        return targets

    def move(
        self,
        target: str,
        old: str,
    ) -> str:

        new = self.storage.create_dir(target)
        self.storage.move(old, new)
        logger.info("Moved question storage from %s to %s", old, target)
        return new

    def get_filedata(self, target: str, *, filename: str | None = None) -> FileData:
        """Read a stored file and return it as FileData.

        Args:
            target (str): Full file path, or directory path when filename is provided.
            filename (str | None): Optional filename to append to target.

        Returns:
            FileData: File metadata and content. Image bytes are base64 encoded;
            other bytes are decoded as UTF-8 with replacement for invalid bytes.
        """
        fpath = self._construct_file_path(target, filename=filename)
        mime_type, _ = mimetypes.guess_type(fpath)
        content = self.read_file(fpath)
        is_image = bool(mime_type and mime_type.startswith("image/"))
        if isinstance(content, bytes):
            encoded = (
                base64.b64encode(content).decode("utf-8")
                if is_image
                else content.decode("utf-8", errors="replace")
            )
        else:
            encoded = content
        return FileData(
            filename=PurePosixPath(fpath).name,
            content=encoded,
            mime_type=mime_type or "application/octet-stream",
        )

    def get_all_filedata(self, dir_path: str) -> List[FileData]:
        """Return FileData for every file directly listed in a directory.

        Args:
            dir_path (str): Directory path to list and read from storage.

        Returns:
            List[FileData]: FileData objects for each listed file.
        """
        return [self.get_filedata(f) for f in self.list_files(dir_path)]

    # Private methods
    def _construct_file_path(
        self, dir_path: str, *, filename: str | None = None
    ) -> str:
        """Construct full file path from directory and optional filename.

        Args:
            dir_path (str): Base directory path
            filename (str | None): Optional filename to append

        Returns:
            str: Full file path (dir_path if no filename, dir_path/filename otherwise)
        """
        if not filename:
            return dir_path.rstrip("/")
        else:
            return f"{dir_path.rstrip('/')}/{filename}"

    def _norm_path(self, val: str | Path | Blob) -> str:
        """Normalizes path to standardized format with trailing slash.

        Args:
            val (str | Path | Blob): Path value to normalize

        Returns:
            str: Normalized path with trailing slash

        Raises:
            InvalidQuestionFile: If path type is not supported
        """
        if isinstance(val, str):
            return val.rstrip("/") + "/"
        elif isinstance(val, Path):
            return val.as_posix().rstrip("/") + "/"
        elif isinstance(val, Blob):
            if not val.name:
                raise ValueError(f"Cannot determine blob: {val}")
            return val.name.rstrip("/") + "/"
        else:
            logger.warning(
                "Cannot normalize unsupported question file path type %s", type(val)
            )
            raise InvalidQuestionFile(
                f"Cannot normalize path: unsupported type {type(val)}"
            )
