# -------------------------
# Standard Library Imports
# -------------------------
import asyncio
import json
import mimetypes
from typing import List
from uuid import UUID
from pathlib import Path

# -------------------------
# Third-Party Imports
# -------------------------
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import Response
from starlette import status
from pydantic import ValidationError

# -------------------------
# Internal Project Imports
# -------------------------
from src.api.core import logger
from src.api.dependencies import StorageTypeDep
from src.api.response_models import (
    FileData,
    SuccessDataResponse,
    SuccessFileResponse,
)
from src.api.db_models.question import Question,QuestionData
from src.api.service.file_service import FileServiceDep, FileService
from src.api.service.question_manager import QuestionManagerDependency
from src.api.service.question_resource import QuestionResourceDepencency
from src.api.service.storage_manager import StorageDependency
from src.utils import encode_image


router = APIRouter(
    prefix="/questions",
    tags=["questions", "files"],
)

CLIENT_FILE_DIR = "clientFiles"


def get_file(files: list[UploadFile], name: str) -> UploadFile | None:
    for f in files:
        if f.filename == name:
            return f
    return None


@router.post("/files")
async def create_question_file_upload(
    qr: QuestionResourceDepencency,
    files: List[UploadFile],
    fm: FileServiceDep,
    question_data: QuestionData | None = None,
    auto_handle_images: bool = True,
) -> Question:
    """
    Create a new question and upload its initial set of files.

    This endpoint supports two ways of specifying question metadata:
    1. Providing an `info.json` file in the upload bundle.
    2. Supplying `question_data` directly via the request body.

    If `info.json` is present, it will be validated using Pydantic. If validation
    fails and no fallback `question_data` is provided, the request is rejected.

    File processing involves:
    - Converting uploaded files (`UploadFile`) to internal `FileData`
    - Sending metadata + files to `QuestionResourceService`
    - Allowing automatic separation of client files (images) if enabled

    Args:
        qr: Injected QuestionResource service.
        files: Uploaded files belonging to the question (HTML, JS, images, metadata, etc.).
        fm: FileService used to convert `UploadFile` → `FileData`.
        question_data: Optional fallback metadata if `info.json` is missing or invalid.
        auto_handle_images: When True, image-like files are routed into a dedicated
            client directory.

    Returns:
        Question: The newly created question record.

    Raises:
        HTTPException(400): Invalid/missing metadata when required.
        HTTPException(500): Unexpected failure while creating the question or processing files.
    """
    qdata_file = get_file(files, "info.json")

    try:
        if qdata_file:
            logger.info("info.json provided. Attempting to validate...")

            # Read and decode the uploaded file
            raw = await qdata_file.read()
            json_data = json.loads(raw.decode("utf-8"))
            # Validate using Pydantic, ignoring extra fields
            qdata = QuestionData.model_validate(json_data, from_attributes=False)
        else:
            qdata = None

    except (ValidationError, json.JSONDecodeError) as e:
        logger.error(f"Failed to validate info.json: {e}")

        # Fallback logic: if no valid info.json and no provided question_data: fail
        if question_data is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "info.json was provided but is invalid, and no fallback question_data "
                    "was provided. Cannot continue."
                ),
            )
        # Otherwise fall back to provided question_data
        qdata = question_data

    try:
        assert qdata
        tasks = [fm.convert_to_filedata(f) for f in (files or [])]
        fdata = await asyncio.gather(*tasks)
        qcreated = await qr.create_question(qdata, fdata, auto_handle_images)
        logger.info("Successfully created question")
        return qcreated
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create question {e} from uploaded files"
        )


# --------------------------
# ---------Retrieving--------
# --------------------------


@router.get("/files/{qid}")
async def get_question_file_names(
    qid: str | UUID,
    qr: QuestionResourceDepencency,
) -> SuccessFileResponse:
    """
    Retrieve the list of files stored for a specific question.

    The service determines the appropriate storage path (local or cloud)
    based on configuration and returns the filenames contained within the
    question’s directory.

    Args:
        qid: The unique identifier of the question.
        qr: Injected QuestionResource service.
        storage_type: Indicates whether local or cloud storage is active.

    Returns:
        SuccessFileResponse: Contains a list of filenames and a success status.

    Raises:
        HTTPException(404): If the question does not exist.
        HTTPException(500): If the file list cannot be retrieved.
    """
    try:
        return await qr.get_question_file_names(qid)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not retrieve file names: {e}",
        )


@router.delete("/files/{qid}/{filename}")
async def delete_file(qid: str | UUID, filename: str, qr: QuestionResourceDepencency):
    """
    Delete a single file associated with a given question.

    Args:
        qid: The unique identifier of the question.
        filename: The name of the file to delete.
        qr: Injected QuestionResource service.

    Returns:
        SuccessDataResponse: Confirmation that the file was deleted.

    Raises:
        HTTPException: If the question or file cannot be resolved.
    """
    try:
        return await qr.delete_file(qid, filename)
    except HTTPException:
        raise


@router.get("/files/{qid}/{filename}")
async def read_question_file(
    qid: str | UUID, filename: str, qr: QuestionResourceDepencency
) -> SuccessDataResponse:
    """
    Read and return the contents of a specific file belonging to a question.

    This endpoint retrieves the file from local or cloud storage and returns
    its decoded UTF-8 content. Binary files are not currently supported.

    Args:
        qid: The ID of the question that owns the file.
        filename: The name of the file to read.
        qr: Injected QuestionResource service.

    Returns:
        SuccessDataResponse: Contains the decoded file contents.

    Raises:
        HTTPException(404): If the question or file cannot be found.
        HTTPException(500): If the file cannot be read or decoded.
    """
    try:
        return await qr.read_file(qid, filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not read file {filename}: {e}",
        )


# Update
@router.put("/files/{qid}/{filename}")
async def update_file(
    qid: str | UUID,
    filename: str,
    new_content: str | dict,
    qr: QuestionResourceDepencency,
) -> SuccessDataResponse:
    """
    Overwrite or update an existing file belonging to a question.

    This endpoint writes new content to the specified file. If the file exists,
    it will be overwritten. Dictionaries are automatically serialized into JSON.

    Args:
        qid: The ID of the question.
        filename: The file to update.
        new_content: The new content to write (string or JSON-serializable dict).
        qr: Injected QuestionResource service.

    Returns:
        SuccessDataResponse: Details and the written content.

    Raises:
        HTTPException(404): If the question or file reference is invalid.
        HTTPException(500): If the write operation fails.
    """
    try:
        return await qr.update_file(qid, filename, new_content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not write file content: {e}",
        )


@router.post("/{id}/upload_files")
async def upload_files_to_question(
    id: str | UUID,
    files: list[UploadFile],
    fm: FileServiceDep,
    qr: QuestionResourceDepencency,
    auto_handle_images: bool = True,
) -> dict:
    """
    Upload and attach additional files to an existing question.

    This endpoint allows clients to upload new files—such as HTML files, scripts,
    metadata, or images—to an already-existing question. All uploaded files are
    converted into internal `FileData` objects and saved to the appropriate storage
    location (local or cloud) via `QuestionResourceService`.

    When `auto_handle_images` is enabled, image-like or client-facing assets
    (e.g., `.png`, `.jpg`, `.jpeg`, `.pdf`) are automatically routed into a
    dedicated `clientFiles` directory within the question's storage path.
    All other files are stored directly in the question's root folder.

    Args:
        id: The unique identifier of the question to attach files to.
        files: A list of `UploadFile` objects received from the client.
        fm: FileService dependency used to convert `UploadFile` → `FileData`.
        qr: QuestionResource service responsible for saving files to storage.
        auto_handle_images: Whether to automatically separate client-facing image
            and document files into the `clientFiles` directory. Defaults to True.

    Returns:
        dict: A response structure containing upload details, such as file paths
            and counts of uploaded files.

    Raises:
        HTTPException(404): If the target question does not exist.
        HTTPException(500): For unexpected failures during file processing
            or storage operations.
    """
    try:
        tasks = [fm.convert_to_filedata(f) for f in (files or [])]
        fdata = await asyncio.gather(*tasks)
        return await qr.upload_files_to_question(id, fdata, auto_handle_images)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error uploading files for question %s: %s", id, e)
        raise HTTPException(
            status_code=500,
            detail=f"Could not process file uploads: {e}",
        )


@router.get("/filedata/{qid}")
async def get_filedata(
    qid: str | UUID,
    qm: QuestionManagerDependency,
    storage: StorageDependency,
    storage_type: StorageTypeDep,
) -> List[FileData]:
    try:
        question = qm.get_question(qid)
        question_path = qm.get_question_path(question.id, storage_type)
        file_paths = [
            Path(f) for f in storage.list_file_paths(question_path, recursive=True)
        ]
        logger.info("These are the file paths", file_paths)
        file_data = []
        for f in file_paths:
            if not f.is_file():
                continue
            try:
                mime_type, _ = mimetypes.guess_type(f.name)
                logger.info(f"File is {f} and mime type {mime_type}")
                if mime_type and (
                    mime_type.startswith("text")
                    or mime_type.startswith("application/json")
                ):
                    content = f.read_text(encoding="utf-8")
                else:
                    content = encode_image(f)
                    logger.info("Encoded image just fine")

                file_data.append(
                    FileData(
                        filename=f.name,
                        content=content,
                        mime_type=mime_type or "application/octet-stream",
                    )
                )
            except Exception as e:
                logger.warning(f"Could not read file {f}: {e}")
                file_data.append(
                    FileData(filename=f.name, content="Could not read file")
                )

        return file_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not get file data {e}")


@router.post("/files/{id}/{filename}/download")
async def download_question_file(
    qid: str | UUID,
    filename: str,
    qm: QuestionManagerDependency,
    qr: QuestionResourceDepencency,
):
    try:
        question = qm.get_question(qid)
        folder_name = f"{question.title}_download"
        file_path = await qr.get_question_file(qid, filename)

        zip_bytes = await FileService().download_zip(
            files=[file_path], folder_name=folder_name
        )

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={folder_name}.zip"},
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not read file {filename}: {e}",
        )


@router.post("/files/{qid}/download")
async def download_question(
    qid: str | UUID,
    qm: QuestionManagerDependency,
    qr: QuestionResourceDepencency,
):
    try:
        question = qm.get_question(qid)
        data = await qr.get_question_filepaths(qid)
        folder_name = f"{question.title}_download"

        zip_bytes = await FileService().download_zip(
            files=[Path(f) for f in data.filenames], folder_name=folder_name
        )

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{folder_name}.zip"'
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not get files {e}",
        )


@router.post("/upload_zip")
async def upload_zip(file: UploadFile, storage: StorageDependency):
    save_path = storage.get_base_path()
    return await FileService().upload_zip_and_extract(file, save_path)
