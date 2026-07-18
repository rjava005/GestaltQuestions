from pydantic import BaseModel, Field, JsonValue
from typing import Sequence, Literal, Dict


Language = Literal["javascript", "python"]


class RuntimeExecutionConfig(BaseModel):
    entry: str = Field(
        ..., description="Entry file to execute (e.g. server.py, server.js, main.py)"
    )
    func_name: str = Field(
        default="generate",
        description="Function to actually execute defaults to generate()",
    )
    language: Language = Field(
        ..., description="The allowed runtimes currently only javascript and python"
    )
    files: Dict[str, str] = Field(..., description="The content of the files")
    generation_context: dict[str, JsonValue] | None = Field(
        default=None,
        description="Optional JSON-safe context passed to the generator.",
    )


class ExecutionResult(BaseModel):
    output: str | dict  # final returned value
    logs: Sequence[str] = []
