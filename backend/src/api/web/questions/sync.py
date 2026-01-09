from typing import List

from fastapi import HTTPException
from fastapi.routing import APIRouter

from src.api.service.question_resource import QuestionResourceDepencency
from src.api.service.storage_manager import StorageDependency
from src.api.response_models.sync_models import *
from src.api.service.sync import QuestionSync


router = APIRouter(prefix="/questions", tags=["questions", "sync", "dev", "local"])


@router.post("/check_unsync", response_model=List[UnsyncedQuestion])
async def check_sync_status(
    qr: QuestionResourceDepencency, storage: StorageDependency
) -> Sequence[UnsyncedQuestion]:
    try:
        return await QuestionSync(storage, qr).check_all_unsync()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check sync {e}")


@router.post("/sync_questions")
async def sync_questions(
    qr: QuestionResourceDepencency, storage: StorageDependency
) -> SyncResponse:
    try:
        result = await QuestionSync(storage, qr).sync_all_questions()
        return SyncResponse(sync_metrics=result[0], sync_raw=result[1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to  sync {e}")


@router.post("/prune_missing_questions")
async def prune_missing_questions(
    qr: QuestionResourceDepencency, storage: StorageDependency
) -> FolderCheckMetrics:
    try:
        return await QuestionSync(storage, qr).prune_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to prune {e}")
