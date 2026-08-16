import multiprocessing
from queue import Empty
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from gestalt_signal_systems.grading import grade_answers

router = APIRouter(prefix="/grading", tags=["grading"])
GRADING_TIMEOUT_SECONDS = 15.0


class GradeRequest(BaseModel):
    answers: dict[str, Any] = Field(default_factory=dict)
    private_data: dict[str, Any]


def _worker(answers: dict[str, Any], private_data: dict[str, Any], queue: Any) -> None:
    queue.put(grade_answers(answers, private_data))


@router.post("/grade")
def grade(request: GradeRequest) -> dict[str, Any]:
    context = multiprocessing.get_context("spawn")
    queue = context.Queue(maxsize=1)
    process = context.Process(
        target=_worker,
        args=(request.answers, request.private_data, queue),
        daemon=True,
    )
    process.start()
    process.join(GRADING_TIMEOUT_SECONDS)
    if process.is_alive():
        process.terminate()
        process.join(1)
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Grading exceeded the sandbox time limit.",
        )
    if process.exitcode != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The grading worker could not evaluate this submission.",
        )
    try:
        return queue.get(timeout=0.5)
    except Empty as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The grading worker returned no result.",
        ) from exc
