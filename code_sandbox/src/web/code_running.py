from fastapi import APIRouter, HTTPException, status
from src.services.code_runner.models import ExecutionResult, RuntimeExecutionConfig
from fastapi import Body
from pydantic import ValidationError
from src.services.code_runner.error_handling import ExecutionError
from src.services.code_runner.javascript_runner import JavaScriptRunner
from src.services.code_runner.python_runner import PythonScriptRunner

router = APIRouter(prefix="/code_runner", tags=["code_running"])


@router.post("/generate")
def execute_code(
    config: RuntimeExecutionConfig = Body(
        example={
            "entry": "server.js",
            "func_name": "generate",
            "language": "javascript",
            "files": {
                "server.js": "function generate(){ return {ok:true}; }\nmodule.exports={generate};"
            },
        }
    ),
) -> ExecutionResult:
    language = config.language

    # Manual switch
    if language == "javascript":
        runner = JavaScriptRunner(config)
    elif language == "python":
        runner = PythonScriptRunner(config)
    else:
        raise HTTPException(
            status_code=500, detail="Received unknown language or none {language}"
        )
    try:
        return runner.run()
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Received a validations error {e}",
        )
    except ExecutionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": getattr(e, "error_code", "EXECUTION_ERROR"),
                "exit_code": getattr(e, "exit_code", None),
                "message": f"Failed to execute: {e}",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected result occured {e}")
