from fastapi import APIRouter, Query

from backend.api.deps import (
    QuestionRuntimeServiceDependency,
)
from backend.question_runtime.model import RuntimeLanguage
from backend.question_runtime.service.question_runtime import RenderedQuestionBundle
from backend.shared import ID

router = APIRouter(
    prefix="/questions/{qid}/runtimes",
    tags=["questions", "runtime"],
)


@router.post("/run", response_model=RenderedQuestionBundle)
async def run(
    qid: ID,
    runtime_service: QuestionRuntimeServiceDependency,
    language: RuntimeLanguage | None = Query(default=None),
):
    return await runtime_service.run(qid, language)
