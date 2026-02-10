import asyncio
import json
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Form, HTTPException, UploadFile
from pydantic import ValidationError
from starlette import status


from src.core import logger
from src.types import FileData, QuestionData
from src.model.question import Question
from src.service import FileService, FileConverter
from src.web.dependencies import (
    QuestionManagerDependency,
)

router = APIRouter(
    prefix="/questions/files",
    tags=["questions", "files"],
)

CLIENT_FILE_DIR = "clientFiles"


# Create question with a payload
@router.post("/")
async def create_question_file_upload(
    qr: QuestionManagerDependency,
    files: List[UploadFile],
    question_data: Optional[str] = Form(None),
    auto_handle_images: bool = True,
) -> Question:

    # Check payload first
    if not question_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Question data is None"
        )
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Files data is None"
        )

    # Try to validate the model
    try:
        if isinstance(question_data, str):
            question_data = json.loads(question_data)
        qdata = QuestionData.model_validate(question_data)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to validate the question data {e}",
        )

    try:
        fm = FileConverter()
        tasks = [fm.convert_to_filedata(f) for f in (files or [])]
        fdata = await asyncio.gather(*tasks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to convert the files {e}")

    # Finally create the question
    try:
        qcreated = await qr.create_question(qdata, fdata, auto_handle_images)
        return qcreated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create question {e} from uploaded files"
        )


# Files
@router.post("/{qid}")
async def upload_files_to_question(
    qid: str | UUID,
    files: list[UploadFile],
    qm: QuestionManagerDependency,
    auto_handle_images: bool = True,
) -> dict:
    """
    Upload and attach additional files to an existing question.

    This endpoint allows clients to upload new files—such as HTML files, scripts,
    metadata, or images—to an already-existing question. All uploaded files are
    converted into internal `FileData` objects and saved to the appropriate storage
    location (local or cloud) via `QuestionManager`.

    When `auto_handle_images` is enabled, image-like or client-facing assets
    (e.g., `.png`, `.jpg`, `.jpeg`, `.pdf`) are automatically routed into a
    dedicated `clientFiles` directory within the question's storage path.
    All other files are stored directly in the question's root folder.

    Args:
        id: The unique identifier of the question to attach files to.
        files: A list of `UploadFile` objects received from the client.
        qm: QuestionManagerDependency service responsible for question including storage and db operations
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
        tasks = [FileService().convert_to_filedata(f) for f in (files or [])]
        fdata = await asyncio.gather(*tasks)
        return await qm.upload_files_to_question(qid, fdata, auto_handle_images)
    except Exception as e:
        logger.exception("Error uploading files for question %s: %s", id, e)
        raise HTTPException(
            status_code=500,
            detail=f"Could not process file uploads: {e}",
        )


# gettings
@router.get("/{qid}")
async def get_question_file_names(
    qid: str | UUID,
    qr: QuestionManagerDependency,
) -> List[str]:
    try:
        return await qr.get_question_file_names(qid)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not retrieve file names: {e}",
        )


@router.get("/filedata/{qid}")
async def get_filedata(
    qid: str | UUID,
    qm: QuestionManagerDependency,
) -> List[FileData]:
    try:
        return await qm.get_question_filedata(qid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not get file data {e}")


@router.get("/{qid}/{filename}")
async def read_question_file(
    qid: str | UUID, filename: str, qr: QuestionManagerDependency
) -> str | None:
    try:
        return await qr.read_file(qid, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not read file {filename}: {e}",
        )


# Updating
@router.put("/{qid}/{filename}")
async def update_file(
    qid: str | UUID,
    filename: str,
    new_content: str | dict,
    qr: QuestionManagerDependency,
) -> bool:
    try:
        return await qr.update_file(qid, filename, new_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not write file content: {e}",
        )


@router.delete("/{qid}/{filename}")
async def delete_file(qid: str | UUID, filename: str, qr: QuestionManagerDependency):
    try:
        return await qr.delete_file(qid, filename)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete the question")
