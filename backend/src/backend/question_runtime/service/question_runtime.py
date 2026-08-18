from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException
from pydantic import BaseModel, Field, JsonValue

from backend.core import logger
from backend.question import QuestionRead
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

from .instance_db import QuestionInstanceDB, as_utc
from .runtime_db import QuestionRuntimeDB
from .runtime_sync import QuestionRunTimeSyncService


class RenderedQuestionBundle(BaseModel):
    instance: UUID = Field(default_factory=uuid4)
    qmeta: QuestionRead
    question_html: str
    solution_html: str | None = None
    logs: list[str] = Field(default_factory=list)
    quiz_data: QuizData | dict | None = None


class QuestionRunTimeService:
    def __init__(
        self,
        qm: QuestionManager,
        runtime_db: QuestionRuntimeDB,
        sandbox: SandboxClient,
        instance_db: QuestionInstanceDB | None = None,
    ) -> None:
        self._qm = qm
        self._runtime_db = runtime_db
        self._sandbox = sandbox
        self._instance_db = instance_db
        self._sync = QuestionRunTimeSyncService(self._runtime_db)

    async def run(
        self,
        qid: ID,
        language: RuntimeLanguage | None,
        generation_context: dict[str, JsonValue] | None = None,
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
            generation_context=generation_context,
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
        if not isinstance(output, dict):
            raise MissingRuntimeOutputError(str(qid))

        logs = data.get("logs", [])

        public_output = deepcopy(output)
        formatted_question = TemplateParser().render(
            question_files.question_html, output
        )
        formatted_solution = TemplateParser().render(
            question_files.solution_html or "", output
        )
        public_solution: str | None = formatted_solution
        instance_id = uuid4()
        if output.get("secure_grading") is True:
            if self._instance_db is None:
                raise RuntimeExecutionError(
                    question_id=str(qid),
                    detail="Secure grading storage is unavailable.",
                )
            answer_specs = output.get("answer_specs")
            correct_answers = output.get("correct_answers")
            if not isinstance(answer_specs, dict) or not isinstance(
                correct_answers, dict
            ):
                raise RuntimeExecutionError(
                    question_id=str(qid),
                    detail=(
                        "Secure output requires answer_specs and "
                        "correct_answers objects."
                    ),
                )
            await self._instance_db.cleanup_expired()
            stored = await self._instance_db.create(
                qid,
                {
                    "answer_specs": answer_specs,
                    "correct_answers": correct_answers,
                    "solution_html": formatted_solution,
                },
            )
            instance_id = stored.id
            public_output.pop("correct_answers", None)
            public_solution = None
        return RenderedQuestionBundle(
            instance=instance_id,
            qmeta=question,
            question_html=formatted_question,
            solution_html=public_solution,
            logs=logs,
            quiz_data=public_output,
        )

    async def grade(
        self, qid: ID, instance_id: UUID, answers: dict[str, Any]
    ) -> dict[str, Any]:
        if self._instance_db is None:
            raise HTTPException(status_code=404, detail="Question instance not found.")
        instance = await self._instance_db.get(instance_id)
        if instance is None or str(instance.question_id) != str(qid):
            raise HTTPException(status_code=404, detail="Question instance not found.")
        if as_utc(instance.expires_at) <= datetime.now(UTC):
            await self._instance_db.delete(instance)
            raise HTTPException(
                status_code=410, detail="Question instance has expired."
            )
        private_data = dict(instance.private_grading_data)
        solution_html = private_data.pop("solution_html", None)
        sandbox_result = await self._sandbox.grade(
            answers=answers, private_data=private_data
        )
        result = {
            "status": sandbox_result.get("status", sandbox_result.get("overall")),
            "answers": sandbox_result.get("answers", sandbox_result.get("slots")),
        }
        if isinstance(solution_html, str):
            result["solution_html"] = solution_html
        await self._instance_db.cleanup_expired()
        return result
