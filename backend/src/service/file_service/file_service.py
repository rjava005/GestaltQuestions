# --- Standard Library ---
import asyncio
import io
import mimetypes
import shutil
import zipfile
from pathlib import Path
from typing import List, Optional, Sequence, Union, cast
import base64

# --- Third-Party ---
from fastapi import HTTPException, UploadFile
from starlette import status

# --- Internal ---
from src.core import logger

from .utils import safe_dir_name
from . import (
    MAX_FILE_SIZE_MB,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    ALLOWED_IMAGE_EXTENSIONS,
    CONTENT_TYPE_MAPPING,
    logger,
    FileData,
    FILE,
    SuccessFileServiceResponse,
)


class FileConverter:
    """Class that converts between paths, files and fastapi upload files"""

    def __init__(
        self,
        max_file_size_mb: int = MAX_FILE_SIZE_MB,
        content_type_mapping: dict[str, str] = CONTENT_TYPE_MAPPING,
    ):
        self.max_file_size = max_file_size_mb * 1024 * 1024
        self.content_type_mapping = content_type_mapping

    async def convert_to_filedata(self, file: FILE) -> FileData:

        if isinstance(file, FileData):
            return file
        if isinstance(file, UploadFile) or hasattr(file, "file"):
            upload_file = cast(UploadFile, file)
            await self._validate_upload_file(upload_file)
            await self._validate_upload_file_size(upload_file)
            filename = upload_file.filename or "untitled.txt"
            mime_type, _ = mimetypes.guess_type(filename)
            if mime_type and (
                mime_type.startswith("text") or mime_type.startswith("application/json")
            ):
                content = await upload_file.read()
            else:
                content = base64.b64encode(await upload_file.read()).decode("utf-8")
            return FileData(
                filename=filename,
                content=content,
                mime_type=mime_type or "application/octet-stream",
            )
        else:
            raise ValueError("FileConverter: Failed to convert file to filedata")

    async def _validate_upload_file(self, file: UploadFile) -> UploadFile:
        if not file.filename:
            raise ValueError("File of type [UploadFile] does not have a filename")
        return file

    async def _validate_upload_file_size(self, file: UploadFile) -> UploadFile:
        contents = await file.read()
        if len(contents) > self.max_file_size:
            raise ValueError(
                f"{file.filename} exceeds {self.max_file_size} MB",
            )
        await file.seek(0)
        return file


class FileService:
    async def validate_file(self, file: UploadFile) -> UploadFile:
        if not file.filename:
            raise HTTPException(status_code=400, detail="There is no file")
        file = await self.validate_file_size(file)
        return file

    async def save_file(self, file: UploadFile, destination: str | Path) -> str:
        """
        Save an uploaded file to the specified destination.

        This method validates the uploaded file, ensures the target directory exists,
        and writes the file contents to disk.

        Args:
            file (UploadFile): The uploaded file received from the client.
            destination (str | Path): The target file path where the upload will be saved.

        Returns:
            str: The absolute path (as a POSIX string) to the saved file.

        Raises:
            HTTPException: If file validation or writing fails.
            OSError: For unexpected file system errors.
        """
        try:
            # Validate upload before saving
            await self.validate_file(file)

            # Normalize to a Path object
            filename = file.filename or "unknownFile.txt"
            destination_path = Path(destination).resolve() / filename
            try:
                # your file or folder creation logic
                destination_path.parent.mkdir(parents=True, exist_ok=True)
            except PermissionError as e:
                logger.error(
                    "Permission denied creating path %s: %s", destination_path, e
                )
                raise

            logger.info("Saving file %s to %s", file.filename, destination_path)

            # Write file content to disk
            with open(destination_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            logger.info("Successfully saved file: %s", destination_path)
            return destination_path.as_posix()

        except Exception as e:
            logger.exception("Error saving file %s: %s", file.filename, e)
            raise

    async def convert_to_uploadfile(
        self, path: Union[Path, str, UploadFile]
    ) -> UploadFile:
        try:
            if isinstance(path, UploadFile):
                return path
            path = Path(path)
            upload_file = UploadFile(
                filename=path.name,
                file=open(path, "rb"),  # important: open in binary mode
            )
            await self.validate_file(upload_file)
            return upload_file
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Could not convert to UploadFile path {path} Error: {e}",
            )

    async def convert_to_filedata(self, path: Union[Path, str, UploadFile]) -> FileData:
        try:
            if isinstance(path, UploadFile) or hasattr(path, "file"):
                upload = cast(UploadFile, path)
                await self.validate_file(upload)
                content = await upload.read()
                filename = upload.filename or "untitled.txt"
                mimetype = self.get_content_type(filename)
                return FileData(filename=filename, content=content, mime_type=mimetype)
            else:
                path = Path(path).resolve()
                if not path.exists() or not path.is_file():
                    raise HTTPException(
                        status_code=400,
                        detail=f"The uploaded file {path} either does not exist or is not a file",
                    )
                return FileData(
                    filename=path.name,
                    content=path.read_text(),
                    mime_type=self.get_content_type(path.name),
                )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Could not convert to filedata. File {path} Error: {e}",
            )

    async def save_files(
        self, files: List[UploadFile], destination: str | Path
    ) -> SuccessFileServiceResponse:
        try:
            await asyncio.gather(*[self.save_file(f, destination) for f in files])
            return SuccessFileServiceResponse(
                status=status.HTTP_200_OK,
                detail="Saved files succesfully",
                path=str(destination),
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not process file uploads {str(e)}",
            )

    async def download_zip(
        self,
        files: Sequence[Union[Path, str]],
        folder_name: Optional[str],
    ) -> bytes:
        """Bundle multiple files into a zip and return as StreamingResponse."""
        buffer = io.BytesIO()
        folder_name = folder_name or "Untitled_Content"
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
            for path in files:
                path = Path(path)
                if path.is_dir():
                    for subfile in path.rglob("*"):
                        if subfile.is_file():
                            arcname = (
                                f"{folder_name}/{subfile.relative_to(path.parent)}"
                            )
                            with open(subfile, "rb") as f:
                                z.writestr(str(arcname), f.read())
                elif path.is_file():
                    arcname = f"{folder_name}/{path.name}"
                    with open(path, "rb") as f:
                        z.writestr(arcname, f.read())
                else:
                    logger.warning(f"[WARN] Skipping invalid path: {path}")
        buffer.seek(0)
        return buffer.getvalue()  # type: bytes


    async def is_image(self, filename: str) -> bool:
        mime_type, _ = mimetypes.guess_type(filename)
        if mime_type and (mime_type in ALLOWED_IMAGE_EXTENSIONS):
            return True
        return False

    # Helpers
    async def validate_file_size(self, file: UploadFile) -> UploadFile:
        try:
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"{file.filename} exceeds {MAX_FILE_SIZE_MB}MB",
                )
            await file.seek(0)
            return file
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not read file contents {str(e)}",
            )

    async def validate_file_contents(self, file: UploadFile) -> bool:
        try:
            assert file.filename
            if not file.content_type:
                raise HTTPException(
                    status_code=status.HTTP_406_NOT_ACCEPTABLE,
                    detail="Cannot determine the file's content type",
                )

            if file.content_type.lower() not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"File of Content type {file.content_type} is not allowed",
                )
            ext = Path(file.filename).suffix.lower()

            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400, detail=f"Invalid file extension: {ext}"
                )
            return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not validate file contents {str(e)}",
            )

    def get_content_type(self, filename: str) -> str:
        """Return MIME type based on file extension, defaults to octet-stream."""
        import os

        ext = os.path.splitext(filename)[1].lower()
        return CONTENT_TYPE_MAPPING.get(ext, "application/octet-stream")
