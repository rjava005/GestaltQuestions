from typing import List, Sequence

from fastapi import HTTPException
from fastapi.routing import APIRouter

from src.web.dependencies import QuestionManagerDependency
from src.web.dependencies import StorageDependency
from src.types import UnsyncedQuestion, SyncResponse, FolderCheckMetrics
from src.service.question_sync.sync import QuestionSync


router = APIRouter(prefix="/questions", tags=["questions", "sync", "dev", "local"])


@router.post("/check_unsync", response_model=List[UnsyncedQuestion])
async def check_sync_status(
    qr: QuestionManagerDependency, storage: StorageDependency
) -> Sequence[UnsyncedQuestion]:
    try:
        return await QuestionSync(storage, qr).check_all_unsync()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check sync {e}")


@router.post("/sync_questions")
async def sync_questions(
    qr: QuestionManagerDependency, storage: StorageDependency
) -> SyncResponse:
    try:
        result = await QuestionSync(storage, qr).sync_all_questions()
        return SyncResponse(sync_metrics=result[0], sync_raw=result[1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to  sync {e}")


@router.post("/prune_missing_questions")
async def prune_missing_questions(
    qr: QuestionManagerDependency, storage: StorageDependency
) -> FolderCheckMetrics:
    try:
        return await QuestionSync(storage, qr).prune_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to prune {e}")
