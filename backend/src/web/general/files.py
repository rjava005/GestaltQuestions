from fastapi import APIRouter, UploadFile



from src.service import FileService
from src.web.dependencies import (
    StorageDependency,
)

router = APIRouter()


@router.post("/upload_zip")
async def upload_zip(file: UploadFile, storage: StorageDependency):
    save_path = storage.get_base_path()
    return await FileService().upload_zip_and_extract(file, save_path)
