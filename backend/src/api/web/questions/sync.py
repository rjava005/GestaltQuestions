from src.api.service import sync
from fastapi.routing import APIRouter
from src.api.db_models import *
from src.api.models.sync_models import *
from src.api.service.question_manager import QuestionManagerDependency
from src.api.service.storage_manager import StorageDependency
from src.api.service.question_resource import QuestionResourceDepencency
from fastapi import HTTPException


router = APIRouter(prefix="/questions", tags=["questions", "sync", "dev", "local"])


@router.post("/check_unsync", response_model=List[UnsyncedQuestion])
async def check_sync_status(
    qm: QuestionManagerDependency, storage: StorageDependency
) -> Sequence[UnsyncedQuestion]:
    try:
        return await sync.check_unsync(storage, qm)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check sync {e}")


@router.post("/sync_questions")
async def sync_questions(qr: QuestionResourceDepencency) -> SyncResponse:
    try:
        result = await sync.sync_questions(qr)
        return SyncResponse(sync_metrics=result[0], sync_raw=result[1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to  sync {e}")


@router.post("/prune_missing_questions")
async def prune_missing_questions(qr: QuestionResourceDepencency) -> FolderCheckMetrics:
    try:
        return await sync.prune_questions(qr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to prune {e}")
