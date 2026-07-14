from fastapi import APIRouter

from backend.api.deps import CurrentUser, TableQueryDependency
from backend.question_views.schema import QuestionSearchParams, QuestionTableRow

router = APIRouter(prefix="/question-tables", tags=["question-tables"])


@router.post("/search")
async def search_questions(
    service: TableQueryDependency,
    params: QuestionSearchParams | None = None,
) -> list[QuestionTableRow]:
    return service.search(params)


@router.post("/published/search")
async def search_published_questions(
    service: TableQueryDependency,
    params: QuestionSearchParams | None = None,
) -> list[QuestionTableRow]:
    return service.search_published_questions(params)


@router.post("/me/search")
async def search_my_questions(
    current_user: CurrentUser,
    service: TableQueryDependency,
    params: QuestionSearchParams | None = None,
) -> list[QuestionTableRow]:
    return service.search_user_questions(current_user, params)
