from uuid import UUID

from fastapi import APIRouter, HTTPException
from starlette import status

from backend.api.deps import (
    QuestionManagerDependency,
    QuestionRuntimeDBDependency,
    QuestionRuntimeSyncDependency,
)
from backend.question_runtime.schema import (
    QuestionRuntimeCreate,
    QuestionRuntimeRead,
)

router = APIRouter(
    prefix="/questions/{qid}/runtimes",
    tags=["questions", "runtime-config"],
)


@router.get("/", response_model=list[QuestionRuntimeRead])
async def list_runtimes(qid: UUID | str, runtime_db: QuestionRuntimeDBDependency):
    return await runtime_db.list_question_runtimes(qid)


@router.post("/", response_model=QuestionRuntimeRead)
async def create_runtime(
    qid: UUID | str,
    payload: QuestionRuntimeCreate,
    runtime_db: QuestionRuntimeDBDependency,
):
    return await runtime_db.create(qid, payload)


@router.post("/sync-from-files", response_model=list[QuestionRuntimeRead])
async def sync_from_files(
    qid: UUID | str,
    qm: QuestionManagerDependency,
    sync: QuestionRuntimeSyncDependency,
):
    question = await qm.qdb.get_question(qid)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Question {qid} does not exist",
        )

    # Get the question files and prepare
    question_files = await qm.get_question_filedata(qid)
    # logger.info("Question Files", question_files)
    return await sync.sync_from_files(qid, question_files)
