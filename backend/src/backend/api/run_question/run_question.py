import mimetypes
from pathlib import PurePosixPath
from typing import Annotated, Literal

from fastapi import APIRouter, Body, HTTPException, Query, Response, status
from pydantic import BaseModel

from backend.api.deps import (
    QuestionManagerDependency,
    QuestionRuntimeServiceDependency,
)
from backend.question_runtime.model import RuntimeLanguage
from backend.question_runtime.service.question_runtime import RenderedQuestionBundle
from backend.shared import ID

router = APIRouter(
    prefix="/questions/{qid}/runtimes",
    tags=["questions", "runtime"],
)

ALLOWED_IMAGE_SUFFIXES = {".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}


class QuestionRunRequest(BaseModel):
    previousCircuitVariant: Literal["lowPass", "highPass"] | None = None


@router.post("/run", response_model=RenderedQuestionBundle)
async def run(
    qid: ID,
    runtime_service: QuestionRuntimeServiceDependency,
    language: Annotated[RuntimeLanguage | None, Query()] = None,
    request: Annotated[QuestionRunRequest | None, Body()] = None,
) -> RenderedQuestionBundle:
    generation_context = (
        request.model_dump(exclude_none=True) if request is not None else None
    )
    return await runtime_service.run(qid, language, generation_context)


@router.get("/assets/{filename:path}", response_class=Response)
async def read_question_asset(
    qid: ID,
    filename: str,
    question_manager: QuestionManagerDependency,
) -> Response:
    """Return a display asset without exposing arbitrary question files."""
    path = PurePosixPath(filename)
    if (
        not filename
        or path.is_absolute()
        or ".." in path.parts
        or "\\" in filename
        or ":" in filename
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    suffix = path.suffix.lower()
    if suffix == ".json":
        media_type = "application/json"
    elif suffix in ALLOWED_IMAGE_SUFFIXES:
        media_type, _ = mimetypes.guess_type(path.name)
    else:
        media_type = None
    if not media_type or (
        suffix != ".json" and not media_type.startswith("image/")
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    try:
        content = await question_manager.read_file(qid, filename)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from exc

    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return Response(content=content, media_type=media_type)
