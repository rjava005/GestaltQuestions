from fastapi import APIRouter, HTTPException
from starlette import status
from typing import Sequence
from src.model.question import Question, QuestionFilter
from fastapi import APIRouter, HTTPException
from src.web.dependencies import QuestionDBDependency, QuestionQueryDependency
from src.app_types.general import ID
from src.model.question import QuestionRead, QuestionTableRow, QuestionFilter
from src.core.logging import logger
router = APIRouter(
    prefix="/questions",
    tags=[
        "questions",
    ],
)


@router.get("/all")
async def get_all(service: QuestionQueryDependency, filter: QuestionFilter) -> Sequence[QuestionTableRow]:
    return await service.get_table()


@router.post("/all")
async def get_all_filtered(
    service: QuestionQueryDependency, filter: QuestionFilter
) -> Sequence[QuestionTableRow]:
    return await service.filter_questions(title=filter.title)


# Retrieving
@router.get("/{qid}")
async def get_question(qid: ID, qdb: QuestionDBDependency) -> Question:
    try:
        question = await qdb.get_question(qid)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not find question {qid}",
            )
        return question
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to get question {e}")


@router.get("/{offset:int}/{limit:int}")
async def get_all_questions(
    qdb: QuestionDBDependency, offset: int = 0, limit: int = 100
) -> Sequence[Question | QuestionRead]:
    try:
        return await qdb.get_all_questions(offset, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get all questions {e}",
        )


@router.post("/filter")
async def filter_questions(
    qdb: QuestionDBDependency, filter: QuestionFilter, offset: int = 0, limit: int = 100
) -> Sequence[QuestionRead]:
    try:
        logger.info("Raw filter crud %s", filter)
        return await qdb.filter_questions(filter)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to filter questions {e}",
        )
