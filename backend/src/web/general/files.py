
from fastapi import APIRouter, HTTPException, UploadFile

from src.web.dependencies import StorageDependency
from src.service.file_service.zip_files import upload_zip_and_extract

router = APIRouter()

@router.post("/upload_zip")
async def upload_zip(
    file: UploadFile, storage: StorageDependency, path: str = "questions"
):
    try:
        return await upload_zip_and_extract(file, storage, path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

