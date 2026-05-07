from pydantic import BaseModel, Field
from src.service.question_rendering.parser import TemplateParser
from fastapi import APIRouter, HTTPException, Query
from starlette import status
from typing import List
from uuid import uuid4, UUID
from typing import Dict, Union, Optional
from src.model.question_attempt import QuizData
from src.core.logging import logger
from src.service.question_packaging.exceptions import MissingQuestionFileError
from src.service.question_packaging.models import PreparedQuestion
from src.service.question_packaging.question_package_builder import (
    QuestionPackageBuilder,
)
from src.model.question import QuestionRead
from src.web.dependencies import SettingDependency
from src.web.question_manager.dependencies import QuestionManagerDependency
from typing import Literal
from src.model.question_attempt import QuizData
from .sandbox_client import execute_sandbox_runtime

router = APIRouter(
    prefix="/runtime/questions",
    tags=["questions", "runtime"],
)


class RenderedQuestionBundle(BaseModel):
    instance: UUID = Field(default_factory=uuid4)
    question_meta: QuestionRead
    question_html: str
    solution_html: str | None = None
    logs: List[str] | None = None
    quiz_data: Optional[Union[QuizData, Dict]] = None


@router.get("/{qid}", response_model=PreparedQuestion)
async def get_question_configuration(
    qm: QuestionManagerDependency,
    qid: str | UUID,
    language: Literal["javascript", "python"] | None = Query(default=None),
) -> PreparedQuestion:
    try:

        # Ensure question exist
        question = await qm.qdb.get_question(qid)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {qid} does not exist",
            )

        # Get the question files and prepare
        question_files = await qm.get_question_filedata(qid)

        return QuestionPackageBuilder().build(
            question_files, question.isAdaptive, language=language
        )
    except MissingQuestionFileError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not contain question.html file",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed {e}")


@router.post("/{qid}")
async def run_question(
    qm: QuestionManagerDependency,
    qid: str | UUID,
    app_settings: SettingDependency,
    language: Literal["javascript", "python"] | None = Query(default=None),
) -> RenderedQuestionBundle:
    sandbox_url = app_settings.SANDBOX_URL
    if not sandbox_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sandbox URL is not configured.",
        )
    # First Check gets question and prepares bundle
    try:
        question = await qm.qdb.get_question(qid)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {qid} does not exist",
            )

        question_files = await qm.get_question_filedata(qid)
        bundle = QuestionPackageBuilder().build(
            question_files, question.isAdaptive, language=language
        )
        question_metadata = await qm.qdb.get_question_data(qid)
    except MissingQuestionFileError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not contain question.html file",
        )
    except Exception as e:
        logger.exception("Failed to prepare question runtime bundle.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to prepare question runtime bundle. {e}",
        ) from e

    # Actual Logic for proper rendiering of the question

    if bundle.kind == "static":
        return RenderedQuestionBundle(
            question_meta=question_metadata,
            question_html=bundle.question_files.question_html,
            solution_html=bundle.question_files.solution_html,
        )
    else:
        payload = bundle.runtime.model_dump(mode="json")  # type: ignore
        raw_output = await execute_sandbox_runtime(sandbox_url, payload)
        output = raw_output.get("output", None)
        logs = raw_output.get("logs", None)

        formatted_question = TemplateParser().render(
            bundle.question_files.question_html, output or {}
        )
        formatted_solution = TemplateParser().render(
            bundle.question_files.solution_html, output or {}
        )
        return RenderedQuestionBundle(
            question_meta=question_metadata,
            question_html=formatted_question,
            solution_html=formatted_solution,
            logs=logs,
            quiz_data=output,
        )
