from typing import List
import httpx
from src.model.files import FileData
from .models import (
    PreparedAdaptiveQuestion,
    PreparedQuestion,
    PreparedStaticQuestion,
    QuestionFiles,
    Language,
)

from src.utils.normalization_utils import normalize_content
from .runtime_preparer import RuntimePreparer
from src.core.logging import logger
from fastapi import HTTPException
from starlette import status


class QuestionRunTimeException(BaseException):
    pass


class QuestionRunTime:

    def __init__(self, base_url: str | None = None):
        if not base_url:
            raise QuestionRunTimeException(
                "Sandbox url must be set for runtime excecution"
            )
        self.base_url = base_url.rstrip("/")

    async def execute(self, payload: dict) -> dict:
        execution_endpoint = f"{self.base_url}/code_runner/generate"

        logger.info("[SANDBOX] Sending runtime payload to %s", execution_endpoint)
        logger.debug("[SANDBOX] Payload: %s", payload)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(execution_endpoint, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as e:
            logger.exception("Sandbox request timed out.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Sandbox request timed out.",
            ) from e
        except httpx.HTTPStatusError as e:
            logger.error(
                "[SANDBOX] Sandbox returned %s: %s",
                e.response.status_code,
                e.response.text,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Sandbox request failed with status {e.response.status_code}: {e.response.text}",
            ) from e
        except httpx.RequestError as e:
            logger.exception("Failed to connect to sandbox service.")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to connect to sandbox service: {e}",
            ) from e
        except ValueError as e:
            logger.exception("Sandbox returned a non-JSON response.")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Sandbox returned an invalid JSON response.",
            ) from e

        if data is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Sandbox returned no response data.",
            )

        logger.info("Sandbox execution completed successfully.")
        return data

    def build(
        self,
        question_files: List[FileData],
        is_adaptive: bool,
        language: Language | None = None,
    ) -> PreparedQuestion:
        files = QuestionFiles.from_file_data(question_files)
        f = {fd.filename: normalize_content(fd.content) for fd in question_files}

        if is_adaptive:
            return PreparedAdaptiveQuestion(
                kind="adaptive",
                runtime=RuntimePreparer().prepare_runtime(f, language=language),
                question_files=files,
            )

        return PreparedStaticQuestion(question_files=files, kind="static")
