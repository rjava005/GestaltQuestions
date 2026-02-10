from fastapi import APIRouter, HTTPException
from starlette import status
from typing import Sequence
from pathlib import Path

from src.core import logger
from src.model.question import Question
from src.types import QuestionData
from src.web.dependencies import (
    QuestionDBDependency,
    QuestionManagerDependency,
)
from src.types import ID


router = APIRouter(
    prefix="/questions",
    tags=["questions", "database"],
)


# POST
@router.post("/")
async def create_question(
    qm: QuestionManagerDependency,
    question: QuestionData,
) -> Question:
    try:
        assert question.title
        qcreated = await qm.create_question(question, files=None)
        return qcreated
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create question {e}",
        )


# Retrieving
@router.get("/{qid}")
async def get_question(qid: ID, qm: QuestionManagerDependency) -> Question:
    try:
        question = await qm.qdb.get_question(qid)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not find question {qid}",
            )
        return question
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to get question {e}")


@router.get("/{id}/all_data")
async def get_question_all_data(id: ID, qm: QuestionManagerDependency) -> QuestionData:
    try:
        question_data = await qm.qdb.get_question_data(id)
        path = await qm.get_question_path(id, relative=True)
        if isinstance(path, Path):
            path = path.as_posix()
        question_data.question_path = path
        return question_data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to retrieve question {e}")


@router.get("/{offset:int}/{limit:int}")
async def get_all_questions(
    qdb: QuestionDBDependency, offset: int = 0, limit: int = 100
) -> Sequence[Question | QuestionData]:
    try:
        return await qdb.get_all_questions(offset, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get all questions {e}",
        )


@router.get("/{offset:int}/{limit:int}/all_data")
async def get_all_questions_data(
    qdb: QuestionDBDependency, offset: int, limit: int
) -> Sequence[QuestionData | Question]:
    data = await qdb.get_all_questions(offset, limit, method="full")
    if not isinstance(data, list):
        raise HTTPException(status_code=500, detail="Invalid data format")
    if not all([isinstance(q, QuestionData) for q in data]):
        raise HTTPException(
            status_code=500,
            detail=f"Invalid data format expected type of QuestionData",
        )
    return data


@router.post("/filter")
async def filter_questions(
    filter_data: QuestionData, qm: QuestionManagerDependency
) -> Sequence[QuestionData]:
    try:
        logger.debug("Retrieved filter %s", filter_data)
        return await qm.qdb.filter_questions(filter_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to filter question {e}")


@router.delete("/{id}")
async def delete_question(id: ID, qr: QuestionManagerDependency):
    try:
        return await qr.delete_question(id)
    except Exception as e:
        HTTPException(status_code=400, detail=f"Failed to delete question {e}")


@router.put("/{id}")
async def update_question(
    id: ID,
    update: QuestionData,
    qm: QuestionManagerDependency,
    update_storage: bool = True,
) -> QuestionData:

    try:
        return await qm.update_question(id, update, update_storage)
    except Exception as e:
        logger.exception(f"Error while updating question {id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update question {e}")
