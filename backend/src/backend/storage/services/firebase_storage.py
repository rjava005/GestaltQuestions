from collections.abc import Sequence
from pathlib import Path
from typing import Literal, cast

from firebase_admin import storage
from google.cloud.storage.blob import Blob

from backend.core import logger

from .base import STORAGE_TYPE, Storage


class FbStorage(Storage):
    def __init__(
        self,
        bucket: str,
    ) -> None:
        logger.info("[Firebase]: Intializing firebase storage ")
        self.bucket = storage.bucket(bucket)
        self.set_storage_type()

    def set_storage_type(self) -> Literal["cloud"] | Literal["local"]:
        self.mode = "cloud"
        return "cloud"

    def get_storage_type(self) -> Literal["cloud"] | Literal["local"]:
        return cast(STORAGE_TYPE, self.mode)

    def exists(self, target: str | Path | Blob) -> bool:
        key = self._to_blob_key(target)
        if key.endswith("/"):
            return self._exists_dir(key)
        return self._exists_file(key)

    def is_dir(self, target: str) -> bool:
        logger.debug(f"Receieved a target {target}")
        blob = self.bucket.blob(target)
        if not blob.name:
            raise ValueError("[FB Storage] Cannot determine blob")
        return blob.name.endswith("/")

    def create_dir(self, target: str) -> str:
        key = self._to_blob_key(target).rstrip("/") + "/"
        blob: Blob = self.bucket.blob(key)

        # Upload empty string
        blob.upload_from_string(data="")
        return str(blob.name)

    def write(
        self,
        target: str,
        data: str | dict | list | bytes | bytearray,
        *,
        overwrite: bool = True,
    ) -> str:
        _ = overwrite
        key = self._to_blob_key(target).rstrip("/")
        blob: Blob = self.bucket.blob(key)
        # Data can either be string or bytes. Since we are passing in bytes this must
        ## be application/octetstream
        blob.upload_from_string(
            self._normalize_content(data), content_type="application/octet-stream"
        )

        return str(blob.name)

    def read(self, target: str) -> bytes | None:
        key = self._to_blob_key(target).rstrip("/")
        if self._exists_file(key):
            return self.bucket.blob(key).download_as_bytes()
        logger.warn(f"Cannot read blob. {key} is not file")
        return None

    def delete(self, target: str | Path | Blob) -> None:
        key = self._to_blob_key(target)
        logger.info(f"Resolved key {key}")
        if key.endswith("/"):
            for blob in self.bucket.list_blobs(prefix=key):
                blob.delete()
                logger.info(
                    f"Deleting {blob}",
                )
            return

        blob = self.bucket.blob(key)
        if blob.exists():
            blob.delete()

    def list(
        self, target: str | Path | Blob, *, recursive: bool = False
    ) -> Sequence[str]:
        key = self._to_blob_key(target).strip("/")
        prefix = f"{key}/" if key else ""
        if not self.exists(prefix):
            raise ValueError("Prefix does not exists")
        logger.info("PREFIX USED: '%s'", prefix)
        if recursive:
            blobs = list(self.bucket.list_blobs(prefix=prefix))
            results = [
                blob.name
                for blob in blobs
                if blob.name != prefix and not blob.name.endswith("/")
            ]
            logger.info("Recursive results: %s", results)
            return results

        # non-recursive
        iterator = self.bucket.list_blobs(prefix=prefix, delimiter="/")
        files = [
            blob.name
            for blob in iterator
            if blob.name != prefix and not blob.name.endswith("/")
        ]
        logger.info("Non-recursive results: %s", files)
        return files

    def download(self, target: str | Path | Blob) -> bytes:
        raise NotImplementedError("Download for firebase not implemented")
        key = self._to_blob_key(target)
        blob = self.bucket.blob(key)
        if not blob.exists():
            raise ValueError("[FB] Failed to download blob. Blob does not exist")
        return blob.download_as_bytes()

    # TODO: implement recursive blob download using list_blobs.
    def copy(
        self,
        source: str | Path | Blob,
        destination: str | Path | Blob,
    ) -> str:

        source_key = self._to_blob_key(source)
        dest_key = self._to_blob_key(destination)

        source_blob = self.bucket.get_blob(source_key)

        if source_blob is None or not source_blob.exists():
            raise ValueError("Source blob does not exist")

        # Download content
        content = source_blob.download_as_bytes()

        # Create destination blob
        dest_blob = self.bucket.blob(dest_key)

        # Overwrite safely
        dest_blob.upload_from_string(content)

        return dest_key

    def move(self, source: str | Path | Blob, destination: str | Path | Blob) -> str:
        try:
            source_prefix = self._to_blob_key(source)
            dest_prefix = self._to_blob_key(destination)

            if not source_prefix.endswith("/"):
                source_prefix += "/"
            if not dest_prefix.endswith("/"):
                dest_prefix += "/"

            blobs = list(self.bucket.list_blobs(prefix=source_prefix))

            if not blobs:
                raise ValueError("Source path does not exist or is empty")

            for blob in blobs:
                # Compute new blob name
                new_name = blob.name.replace(source_prefix, dest_prefix, 1)

                # Use native GCS copy (faster, server-side)
                # new_blob = self.bucket.cop(blob, self.bucket, new_name)
                self.bucket.blob(new_name).upload_from_string(blob.download_as_bytes())
                # Delete original
                blob.delete()

            return dest_prefix

        except Exception as e:
            raise ValueError(f"Failed to move directory: {e}") from e

    def _hard_delete(self) -> None:
        blobs = self.bucket.list_blobs()
        for blob in blobs:
            blob.delete()

    # Custom methods

    def _to_blob_key(self, value: str | Path | Blob) -> str:
        """
        Convert input to a cloud object key without filesystem normalization.
        Keep trailing "/" so directory marker blobs remain addressable.
        """
        if isinstance(value, Blob):
            if not value.name:
                raise ValueError(f"Cannot determine blob: {value}")
            key = value.name
        else:
            key = str(value)
        return key.replace("\\", "/").lstrip("/")

    def _exists_file(self, target: str | Path | Blob) -> bool:
        key = self._to_blob_key(target).rstrip("/")
        if not key:
            return False
        return bool(self.bucket.get_blob(key))

    def _exists_dir(self, target: str | Path | Blob) -> bool:
        key = self._to_blob_key(target).rstrip("/") + "/"
        marker_blob = self.bucket.get_blob(key)
        if marker_blob is not None:
            return True
        return any(self.bucket.list_blobs(prefix=key, max_results=1))

    def _is_empty_dir(self, target: str) -> bool:
        key = self._to_blob_key(target).rstrip("/") + "/"
        marker_blob = self.bucket.get_blob(key)
        if marker_blob is None:
            return False
        blobs = self.bucket.list_blobs(prefix=key)
        return all(blob.name == key for blob in blobs)
