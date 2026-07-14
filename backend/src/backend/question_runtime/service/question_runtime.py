from uuid import UUID, uuid4

from backend.question_runtime.model import RuntimeLanguage
from fastapi import HTTPException
from pydantic import BaseModel, Field

from backend.core import logger
from backend.question_attempt.schema import QuizData
from backend.question_manager import QuestionManager
from backend.question_rendering.parser import TemplateParser
from backend.question_runtime.exceptions import (
    MissingRuntimeOutputError,
    RuntimeExecutionError,
)
from backend.question_runtime.model import RuntimeLanguage
from backend.question_runtime.schema import (
    QuestionFiles,
    RuntimeExecutionConfig,
)
from backend.sandbox_client import SandboxClient
from backend.shared import ID
from backend.question import QuestionRead
from .runtime_db import QuestionRuntimeDB
from .runtime_sync import QuestionRunTimeSyncService

class RenderedQuestionBundle(BaseModel):
    instance: UUID = Field(default_factory=uuid4)
    qmeta: QuestionRead
    question_html: str
    solution_html: str | None = None
    logs: list[str] = []
    quiz_data: QuizData | dict | None = None


class QuestionRunTimeService:
    def __init__(
        self, qm: QuestionManager, runtime_db: QuestionRuntimeDB, sandbox: SandboxClient
    ) -> None:
        self._qm = qm
        self._runtime_db = runtime_db
        self._sandbox = sandbox
        self._sync = QuestionRunTimeSyncService(self._runtime_db)

    async def run(
        self, qid: ID, language: RuntimeLanguage | None
    ) -> RenderedQuestionBundle:
        question = await self._qm.get_question(qid, method="full")
        if not question:
            raise ValueError("Question not found")
        question_files = await self._qm.get_question_filedata(qid)
        await self._sync.sync_from_files(qid, question_files)
        # Handle conversion from filedata->dict and packaged model
        question_files = QuestionFiles.from_file_data(question_files)
        if not question.isAdaptive:
            return RenderedQuestionBundle(
                qmeta=question,
                question_html=question_files.question_html,
                solution_html=question_files.solution_html,
            )
        runtime = (
            await self._runtime_db.get_for_language(qid, language)
            if language is not None
            else await self._runtime_db.get_default(qid)
        )
        if runtime is None:
            detail = (
                f"No enabled runtime found for language {language}"
                if language is not None
                else "No enabled default runtime found"
            )
            raise ValueError(detail)
        exc_bundle = RuntimeExecutionConfig(
            entry=runtime.entry,
            language=runtime.language,  # type: ignore
            func_name=runtime.func_name,
            files=question_files.files,
        )
        
        try:
            data = await self._sandbox.execute(exc_bundle.model_dump(mode="json"))
        except HTTPException as exc:
            raise RuntimeExecutionError(
                question_id=str(qid),
                detail=exc.detail,
                status_code=exc.status_code,
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error executing runtime for question %s", qid)
            raise RuntimeExecutionError(
                question_id=str(qid),
                detail="An unexpected error occurred.",
            ) from exc
        output = data.get("output")
        if output is None:
            raise MissingRuntimeOutputError(str(qid))

        logs = data.get("logs", [])

        formatted_question = TemplateParser().render(
            question_files.question_html, output or {}
        )
        formatted_solution = TemplateParser().render(
            question_files.solution_html or "", output or {}
        )
        return RenderedQuestionBundle(
            qmeta=question,
            question_html=formatted_question,
            solution_html=formatted_solution,
            logs=logs,
            quiz_data=output,
        )
