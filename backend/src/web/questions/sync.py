from typing import List, Sequence

from fastapi import HTTPException
from fastapi.routing import APIRouter

from src.web.dependencies import QuestionDBDependency
from src.web.dependencies import StorageDependency
from src.service.question_sync.sync import (
    QuestionSyncNew,
    UnsyncedQuestion,
    FolderCheckMetrics,
    SyncResponse,
)

router = APIRouter(prefix="/questions", tags=["questions", "sync", "dev", "local"])


@router.post("/check_unsync", response_model=List[UnsyncedQuestion])
async def check_sync_status(
    qdb: QuestionDBDependency, storage: StorageDependency
) -> Sequence[UnsyncedQuestion]:
    try:
        return await QuestionSyncNew(storage, qdb=qdb).check_unsync("questions/")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check sync {e}")


@router.post("/sync_questions")
async def sync_questions(
    qdb: QuestionDBDependency, storage: StorageDependency
) -> SyncResponse:
    try:
        return await QuestionSyncNew(storage, qdb=qdb).sync_all_questions(
            "questions/", storage_type="cloud"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to  sync {e}")


@router.post("/prune_missing_questions")
async def prune_missing_questions(
    qdb: QuestionDBDependency, storage: StorageDependency
) -> FolderCheckMetrics:
    try:
        return await QuestionSyncNew(storage, qdb=qdb).prune_all(
            target="/questions", storage_mode="cloud"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to prune {e}")
