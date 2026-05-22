import asyncio
from collections.abc import Sequence

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from starlette import status

from src.app_types.general import ID
from src.model.files import FileData
from src.model.question import (
    Question,
    QuestionCreate,
    QuestionFilter,
    QuestionRead,
    QuestionUpdate,
)
from src.service.file_service.file_service import UploadFileDataConverter
from src.service.file_service.zip_files import download_zip
from src.web.user.dependencies import CurrentUser

from .dependencies import DeveloperQuestionManagerDependency

router = APIRouter(
    prefix="/developer/questions",
    tags=["developer", "questions"],
)


class WriteFilePayload(BaseModel):
    content: str


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_question(
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
    payload: QuestionCreate,
) -> Question:
    try:
        return await question_manager.create_question(current_user, payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create question: {e}",
        ) from e


@router.get("/")
async def list_my_questions(
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
) -> list[Question] | list[QuestionRead]:
    try:
        return await question_manager.list_my_questions(current_user, method="full")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list questions: {e}",
        ) from e


@router.post("/filter")
async def filter(
    current_user: CurrentUser,
    filter: QuestionFilter,
    question_manager: DeveloperQuestionManagerDependency,
) -> Sequence[QuestionRead]:
    try:
        return await question_manager.filter_questions(current_user, filter)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete question file: {e}",
        ) from e


@router.get("/{question_id}")
async def get_question(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
) -> QuestionRead | Question:
    try:
        return await question_manager.get_question(
            current_user, question_id, method="full"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed to get question: {e}",
        ) from e


@router.patch("/{question_id}")
async def update_question(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
    update: QuestionUpdate,
) -> QuestionRead:
    try:
        return await question_manager.update_question(current_user, question_id, update)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update question: {e}",
        ) from e


@router.delete("/{question_id}")
async def delete_question(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
) -> bool:
    try:
        return await question_manager.delete_question(current_user, question_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete question: {e}",
        ) from e


@router.post("/{question_id}/copy")
async def copy_question(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
):
    try:
        return await question_manager.copy_question(question_id, current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"{e}"
        ) from e


@router.post("/{question_id}/download")
async def download_question_as_zip(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
):
    try:
        q = await question_manager.get_question(current_user, question_id)
        payload = await question_manager.prepare_question_download(
            current_user, question_id
        )
        response = download_zip(payload, folder_name=q.title or "Untitled Questions")
        return Response(
            content=response,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{q.title}.zip"'},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"{e}"
        ) from e


@router.post("/{question_id}/{filename}/download")
async def donwload_question_file(
    question_id: ID,
    filename: str,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
):
    try:
        await question_manager.get_question(current_user, question_id)
        content = await question_manager.read_file(current_user, question_id, filename)
        if content is None:
            content = b""
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"{e}"
        ) from e


@router.get("/{question_id}/files")
async def get_question_files(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
) -> Sequence[str]:
    try:
        return await question_manager.get_question_files(current_user, question_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list question files: {e}",
        ) from e


@router.get("/{question_id}/filedata")
async def get_question_filedata(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
) -> Sequence[FileData]:
    try:
        return await question_manager.get_question_filedata(current_user, question_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list question files: {e}",
        ) from e


@router.post("/{question_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_files(
    question_id: ID,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
    files: list[UploadFile],
) -> list[str]:
    try:
        converter = UploadFileDataConverter()
        file_data = await asyncio.gather(
            *[converter.convert_to_filedata(file) for file in files]
        )
        return await question_manager.upload_files(current_user, question_id, file_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload question files: {e}",
        ) from e


@router.get("/{question_id}/files/{filename}")
async def read_file(
    question_id: ID,
    filename: str,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
) -> bytes | None:
    try:
        return await question_manager.read_file(current_user, question_id, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed to read question file: {e}",
        ) from e


@router.put("/{question_id}/files/{filename}")
async def write_file(
    question_id: ID,
    filename: str,
    data: WriteFilePayload,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
):
    try:
        return await question_manager.write_file(
            current_user, question_id, filename, data.content
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to write question file: {e}",
        ) from e


@router.delete("/{question_id}/files/{filename}")
async def delete_file(
    question_id: ID,
    filename: str,
    current_user: CurrentUser,
    question_manager: DeveloperQuestionManagerDependency,
):
    try:
        return await question_manager.delete_file(current_user, question_id, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete question file: {e}",
        ) from e
