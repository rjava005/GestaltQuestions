from pathlib import Path
from typing import IO, List, Optional
import json
from firebase_admin import storage
from google.cloud.storage.blob import Blob
from src.core.logging import logger
from .base import StorageService
from src.service.file_service.file_service import FileService


class FirebaseStorage(StorageService):
    def __init__(self, bucket, root, base):
        logger.info("[Firebase]: Intializing firebase storage ")
        self.bucket = storage.bucket(bucket)
        # The base is the name of where the storage starts

        # This is the root of the cloud storage
        #  This is meant for things such as UCRQUestions or CalPolyQuestions
        self.root = root
        # The base would be used for specific users such as UCRQuestions/Luciano
        self.base = base

    # =========================================================================
    # Base path and metadata
    # =========================================================================
    def get_root_path(self) -> str:
        return Path(self.root).as_posix()

    def get_base_path(self) -> str:
        return (Path(self.root) / self.base).as_posix()

    def get_relative_to_base(self, target: str | Path | Blob) -> str:
        if isinstance(target, Blob):
            target = str(target.name)
        # Convert to Path
        target_path = Path(target)

        # Case 1: Absolute path inside the storage _root_path
        try:
            relative_path = target_path.relative_to(self.root)
            logger.info("Retrieved relative path fine %s", relative_path)
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
        The relative will always be returned
        """
        rel_str = self.get_relative_to_base(target)
        if relative:
            return rel_str

        return (Path(self.get_root_path()) / rel_str).as_posix()

    def create_storage_path(self, target: str | Path) -> str:
        target_blob = self.get_storage_path(target, relative=False)
        blob: Blob = self.bucket.blob(target_blob)
        blob.upload_from_string("")
        return str(blob.name)

    def copy_storage(self, old: str | Path, new: str | Path) -> str:
        old = self.get_storage_path(old, relative=False)
        new = self.get_storage_path(new, relative=True)

        old_blob = self.bucket.get_blob(old)
        new_blob = self.bucket.copy_blob(old_blob, self.bucket, new)
        assert old_blob
        old_blob.delete()
        logger.info(f"[FirebaseStorage] Copied {old} → {new}")
        return str(new_blob.name)

    def ensure_storage_path(self, target: str | Path) -> str:
        if not self.does_storage_path_exist(target):
            logger.info("Storage Path does not exist creating one ")
            return self.create_storage_path(target)
        logger.info("Storage path exist")
        return self.get_storage_path(target, relative=False)

    def does_storage_path_exist(self, target: str | Path) -> bool:
        target = self.get_storage_path(target, relative=False)
        blobs = list(self.bucket.list_blobs(prefix=target, max_results=1))
        has_others = len(blobs) > 0
        return len(blobs) > 0 or has_others

    def rename_storage(self, old: str | Path, new: str | Path) -> str:
        # Ensure that we get the blobs in the correct path
        old_path = self.get_storage_path(old, relative=False)
        new_path = self.get_storage_path(new, relative=False)

        old_blob = self.bucket.get_blob(old_path)
        logger.debug(f"This is the old blob {old_path}, {old_blob}")
        # Copy the blob to the new location
        new_blob = self.bucket.copy_blob(old_blob, self.bucket, new_path)
        # Delete the original blob
        assert old_blob
        old_blob.delete()

        logger.info(f"[FirebaseStorage] Renamed {old_path} → {new_path}")
        return str(new_blob.name)

    # =========================================================================
    # File operations: read, write, fetch
    # =========================================================================
    def read_file(
        self, target: str | Path, filename: Optional[str] = None
    ) -> bytes | None:
        try:
            file = self.get_file_path(target, filename)
            blob = self.bucket.get_blob(file)
            if blob is None:
                return None
            return blob.download_as_bytes()

        except Exception as e:
            raise ValueError(f"Could not read contents from blob {e}")

    def download_file(
        self, target: str | Path, filename: str | None = None
    ) -> bytes | None:
        return self.read_file(target, filename)

    def get_file_path(self, target: str | Path, filename: str | None = None) -> str:
        storage = Path(self.get_storage_path(target, relative=False))
        if filename:
            return (storage / filename).as_posix()
        return storage.as_posix()

    def open_file_stream(self, target: str | Path, filename: str) -> IO[bytes]:
        return super().open_file_stream(target, filename)

    def upload_file(
        self,
        file_obj: IO[bytes] | bytes,
        target: str | Path,
        filename: str | None = None,
        content_type: str = "application/octet-stream",
    ) -> Blob:
        """
        Upload a file to Firebase Storage. Supports both raw bytes and file-like objects.
        """
        target_dir = Path(self.get_storage_path(target, relative=False))

        # Determine final file path
        if filename:
            file_path = target_dir / filename
        else:
            if not target_dir.is_file():
                raise ValueError("A filename must be provided for non-file targets.")
            filename = target_dir.name
            file_path = target_dir
        blob = self.bucket.blob(file_path.as_posix())

        # --- Case 1: raw bytes passed directly
        if isinstance(file_obj, (bytes, bytearray)):
            blob.upload_from_string(
                data=file_obj,
                content_type=content_type,
            )
            return blob

        # --- Case 2: file-like object (e.g., BytesIO, uploaded file)
        try:
            file_obj.seek(0)  # type: ignore
        except Exception:
            pass  # ignore if stream doesn't support seeking

        blob.upload_from_file(
            file_obj,
            content_type=content_type,
        )

        return blob

    def save_file(
        self,
        target: str | Path,
        content: str | dict | List | bytes | bytearray,
        filename: str | None = None,
        overwrite: bool = True,
    ) -> str:

        try:
            # Resolve directory path
            target_dir = Path(self.get_storage_path(target, relative=False))

            # Determine final file path
            if filename:
                file_path = target_dir / filename
            else:
                if not target_dir.is_file():
                    raise ValueError(
                        "A filename must be provided for non-file targets."
                    )
                filename = target_dir.name
                file_path = target_dir

            # Ensure directory exists (make sure this is a DIRECTORY)
            self.ensure_storage_path(target_dir.as_posix())

            # Create Firebase blob reference
            blob = self.bucket.blob(file_path.as_posix())

            # Normalize content
            if isinstance(content, (dict, list)):
                content_bytes = json.dumps(content, indent=2).encode("utf-8")

            elif isinstance(content, str):
                content_bytes = content.encode("utf-8")

            elif isinstance(content, (bytes, bytearray)):
                content_bytes = bytes(content)

            else:
                raise ValueError(f"Unsupported content type: {type(content)}")

            # Content type detection
            content_type = FileService().get_content_type(filename)

            # Upload to Firebase
            blob.upload_from_string(
                data=content_bytes,
                content_type=content_type,
            )

            # Return file path or URI
            return self.get_file_path(target, filename)

        except Exception as e:
            raise ValueError(f"Could not save file '{filename}': {e}") from e

    # =========================================================================
    # Metadata operations
    # =========================================================================
    def get_metadata(self, target: str | Path, filename: str | None = None) -> dict:
        return super().get_metadata(target, filename)

    def get_public_url(
        self, target: str | Path, filename: str | None = None, expires_in: int = 3600
    ) -> str:
        return super().get_public_url(target, filename, expires_in)

    # =========================================================================
    # File listing, checks, existence
    # =========================================================================

    def list_file_names(self, target: str | Path) -> List[str]:
        return [
            Path(f).name
            for f in self.list_file_paths(target, recursive=False)
            if not f.endswith("/") and "." in Path(f).name
        ]

    def list_file_paths(self, target: str | Path, recursive: bool = False) -> List[str]:
        target = Path(self.get_storage_path(target, relative=False)).as_posix()

        # Ensure consistent prefix ending
        if not target.endswith("/"):
            target = target + "/"

        blobs = list(self.bucket.list_blobs(prefix=target))

        if not recursive:
            # Only return immediate children (no nested directories)
            result = []
            for blob in blobs:
                relative = blob.name[len(target) :]  # strip prefix
                if "/" not in relative:  # ensure not nested
                    result.append(blob.name)
            return result

        # Recursive: include everything under this prefix
        return [blob.name for blob in blobs]

    def does_file_exist(self, target: str | Path, filename: str | None = None):
        return Path(self.get_file_path(target, filename)).exists()

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
        target = self.get_file_path(target, filename)
        blob = self.bucket.get_blob(target)
        if blob and blob.exists():
            blob.delete()

    def delete_storage(self, target: str | Path) -> None:
        file_paths = self.list_file_paths(target)
        for f in file_paths:
            self.delete_file(f)

    def hard_delete(self) -> None:
        self.delete_storage(self.get_root_path())
