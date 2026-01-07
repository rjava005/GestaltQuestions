from typing import Literal, Sequence
from code_sandbox.code_runner.javascript_runner import JavaScriptRunner
from code_sandbox.code_runner.python_runner import PythonScriptRunner
from code_sandbox.code_runner.base import CodeRunner
from pydantic import BaseModel, Field, ConfigDict

from code_sandbox.code_runner.models import ExecutionResult
from code_sandbox.code_runner.base import CodeRunner
from code_sandbox.api.core import logger


class Generator(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    runner: CodeRunner = Field(
        ...,
        description="The runtime executor responsible for running code.",
    )
    extensions: Sequence[str] = Field(
        ...,
        description="File extensions supported by this runtime.",
    )


GENERATOR_MAPPING = {
    "python": Generator(runner=PythonScriptRunner(), extensions=[".py"]),
    "javascript": Generator(runner=JavaScriptRunner(), extensions=[".mjs", ".js"]),
}


def run_generate(
    code: str, language: Literal["python", "javascript"]
) -> ExecutionResult:
    try:
        generator = GENERATOR_MAPPING[language]
        runner = generator.runner
        valid_extensions = generator.extensions

        logger.info(f"[Runtime Switcher] Running {runner} from {language}")
        return runner.run(code)
    except Exception as e:
        logger.exception(
            f"[Runtime Switcher] Unexpected error during {language} execution | '"
        )
        raise ValueError(f"Failed to execute code {e} ")
