from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from starlette import status


from src.types import Response
from src.service import FileService
from src.web.dependencies import (
    QuestionManagerDependency,
)

router = APIRouter(
    prefix="/questions/download",
    tags=["questions", "download"],
)


@router.post("/{qid}")
async def download_question(
    qid: str | UUID,
    qr: QuestionManagerDependency,
):
    try:
        question = qr.qm.get_question(qid)
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


@router.post("/{qid}/filename")
async def download_question_file(
    qid: str | UUID,
    filename: str,
    qm: QuestionManagerDependency,
    qr: QuestionManagerDependency,
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
