from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from backend.api.deps import StorageDependency
from backend.storage import extract_zip_files
from backend.utils import safe_dir_name

router = APIRouter(
    prefix="/questions/upload",
    tags=["questions", "upload", "files"],
)


class UploadZipResponse(BaseModel):
    detail: str
    zip_path: str
    file_count: int


@router.post("/upload_zip")
async def upload_zip(file: UploadFile, storage: StorageDependency) -> UploadZipResponse:
    filename = file.filename

    # Validate the zip file
    if not filename:
        raise ValueError(f"File {file} has no name")
    if not filename.endswith(".zip"):
        ext = filename.split(".")[-1]
        raise ValueError(f"Expected zip file extension, received '{ext}'")
    content = await file.read()
    if not content:
        raise ValueError("Zip file is empty")

    # Create the base path to store the content
    name = filename.removesuffix(".zip")
    safe_name = safe_dir_name(name)
    base = f"questions/{safe_name}"
    # Extract and reset file

    extracted_files = extract_zip_files(content)
    await file.seek(0)

    # Write the content
    # Ensure dir exist
    storage.create_dir(base)

    for filename, content in extracted_files.items():
        target = f"{base}/{filename}"
        storage.write(target, content)

    return UploadZipResponse(
        detail=f"Uploaded zip and extracted files to {base}",
        zip_path=base,
        file_count=len(extracted_files),
    )


# @router.post("/filter")
# async def filter_questions(
#     filter_data: QuestionData,
#     qm: QuestionManagerDependency,
#     storage_type: StorageTypeDep,
# ) -> Sequence[QuestionData]:
#     try:
#         logger.debug("Retrieved filter %s", filter_data)
#         return await filter_question_data(qm.qdb.session, filter_data)
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to filter question {e}")
