from fastapi import APIRouter, HTTPException, status
from code_sandbox.code_runner.models import ExecutionRequest, ExecutionResult
from code_sandbox.code_runner.runtime_switcher import run_generate
from code_sandbox.code_runner.runtime_switcher import run_generate
from pydantic import ValidationError

router = APIRouter(prefix="/code_runner", tags=["code_running"])


@router.post("/generate")
def execute_code(data: ExecutionRequest) -> ExecutionResult:
    language = data.language
    try:
        return run_generate(data.code, language=language)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Received a validations error {e}",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={f"Could not execute code {e}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected result occured {e}")
