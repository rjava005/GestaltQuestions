# Standard library
from pathlib import Path
from typing import Literal, Sequence
from uuid import UUID
import httpx
from pydantic import ValidationError
import json

# Third-party libraries
from fastapi import APIRouter, HTTPException

# Local application imports
from src.api.core import logger
from src.code_runner.models import QuizData
from src.api.service.question_resource import QuestionResourceDepencency
from src.api.dependencies import SettingDependency
from pydantic import BaseModel

router = APIRouter(prefix="/run_server", tags=["code_running", "questions"])

MAPPING_DB = {"python": "server.py", "javascript": "server.js"}
MAPPPING_FILENAME = {"python": "server.py", "javascript": "server.js"}


class ExecutionResult(BaseModel):
    output: str | dict  # final returned value
    logs: Sequence[str] = []


@router.post("/{qid}/{server_language}")
async def run_server(
    qid: str | UUID,
    server_language: Literal["python", "javascript"],
    qr: QuestionResourceDepencency,
    app_settings: SettingDependency,
) -> QuizData:

    sandbox_url = app_settings.SANDBOX_URL

    # -----------------------
    # Validate input language
    # -----------------------
    if server_language not in MAPPPING_FILENAME:
        msg = f"Unsupported server language '{server_language}'. Allowed: {list(MAPPPING_FILENAME.keys())}"
        logger.error(msg)
        raise HTTPException(status_code=400, detail=msg)

    server_file = MAPPPING_FILENAME[server_language]

    # -----------------------
    # Validate server file exists
    # -----------------------
    question_files = await qr.list_all_question_files(qid)
    if server_file not in question_files:
        msg = (
            f"Missing server file '{server_file}' for question '{qid}'. "
            f"Available files: {question_files}"
        )
        logger.error(msg)
        raise HTTPException(status_code=404, detail=msg)

    # -----------------------
    # Run file in sandbox
    # -----------------------
    try:
        server_path = await qr.get_question_file(qid, server_file)
        server_content = Path(server_path).read_text()

        logger.info(
            f"Executing {server_language} server file '{server_file}' "
            f"for question '{qid}' using sandbox at {sandbox_url}"
        )

        async with httpx.AsyncClient() as client:
            generate_endpoint = f"{sandbox_url}/code_runner/generate"
            payload = {
                "language": server_language,
                "code": server_content,
            }
            res = await client.post(generate_endpoint, json=payload)

    except Exception as e:
        logger.exception(
            f"Sandbox execution failed for question '{qid}' "
            f"language='{server_language}' file='{server_file}'"
        )
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to execute {server_language} server file '{server_file}'. "
                f"Sandbox error: {str(e)}"
            ),
        ) from e

    # -----------------------
    # Parse and validate response
    # -----------------------
    try:
        raw_data = res.json()
    except ValueError:
        raw_data = res.text
        logger.warning(
            f"Sandbox returned non-JSON response for question '{qid}': {raw_data}"
        )

    try:
        data = ExecutionResult.model_validate(raw_data)
    except ValidationError as e:
        logger.error("ExecutionResult validation failed", extra={"response": raw_data})
        raise HTTPException(
            status_code=500,
            detail=f"Execution result was malformed: {e}",
        )

    if not data.output:
        msg = (
            f"Sandbox executed file '{server_file}' but returned no quiz output. "
            f"Logs: {data.logs}"
        )
        logger.error(msg)
        raise HTTPException(status_code=500, detail=msg)

    # -----------------------
    # Build QuizData + attach logs
    # -----------------------

    # Ensure that the output data is a dict or convert
    if isinstance(data.output, str):
        try:
            data.output = json.loads(data.output)
        except json.JSONDecodeError:
            logger.error(f"Output string was not valid JSON: {data.output}")
            raise HTTPException(
                status_code=500,
                detail="Sandbox returned output as a string that could not be parsed into JSON.",
            )

    try:
        logger.info(f"The raw output {data.output}")
        quiz_data = QuizData.model_validate(data.output)
        quiz_data.logs.extend(data.logs)

    except ValidationError as e:
        logger.error(
            f"QuizData validation failed for question '{qid}'. Raw output:",
            extra={"output": data.output},
        )
        raise HTTPException(
            status_code=400,
            detail=f"Quiz data is not in the expected format: {e}",
        )

    logger.info(
        f"QuizData successfully generated for question '{qid}'. "
        f"Logs count: {len(quiz_data.logs)}"
    )

    return quiz_data
