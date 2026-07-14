import json
from typing import Literal, Union
from uuid import UUID

from pydantic import BaseModel, Field

from backend.storage import FileData
from backend.utils import normalize_content

from .exceptions import MissingQuestionFileError
from .model import RuntimeConfigSource, RuntimeLanguage

Language = Literal["javascript", "python"]


# The configg base is what the user specifies in the folder, the actual payload is constructed during
# Loading of the files this must reference the code_sandbox/src/services/code_runner/models.py Ideally
# It would be a shared module but not sure how to handle that
class RunTimeConfigBase(BaseModel):
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


class RuntimeExecutionConfig(RunTimeConfigBase):
    files: dict[str, str] = Field(
        default_factory=dict, description="The content of the files"
    )


class RuntimePackageConfig(BaseModel):
    default_language: Language | None = Field(
        description="The default language for runtimes", default=None
    )
    runtimes: dict[Language, RunTimeConfigBase]


class QuestionFiles(BaseModel):
    question_html: str
    solution_html: str | None = None
    files: dict[str, str]

    @classmethod
    def from_file_data(cls, question_files: list[FileData]):
        files = {fd.filename: normalize_content(fd.content) for fd in question_files}

        if "question.html" not in files:
            raise MissingQuestionFileError("Question must include question.html")
        return cls(
            question_html=files["question.html"],
            solution_html=files.get("solution.html"),
            files=files,
        )


class PreparedQuestionBase(BaseModel):
    kind: Literal["static", "adaptive"]
    question_files: QuestionFiles


class PreparedStaticQuestion(PreparedQuestionBase):
    pass


class PreparedAdaptiveQuestion(PreparedQuestionBase):
    runtime: RuntimeExecutionConfig


PreparedQuestion = Union[PreparedStaticQuestion, PreparedAdaptiveQuestion]


# Runtime schemas for configuration, reading and updating
class QuestionRuntimeBase(BaseModel):
    language: RuntimeLanguage
    entry: str
    func_name: str = "generate"
    is_default: bool = False
    enabled: bool = True


class QuestionRuntimeCreate(QuestionRuntimeBase):
    source: RuntimeConfigSource = RuntimeConfigSource.MANUAL


class QuestionRuntimeUpdate(BaseModel):
    entry: str | None = None
    func_name: str | None = None
    is_default: bool | None = None
    enabled: bool | None = None


class QuestionRuntimeRead(QuestionRuntimeBase):
    id: str | UUID
    question_id: str | UUID
    source: RuntimeConfigSource


class RunTimeConfig(BaseModel):
    runtimes: list[QuestionRuntimeBase]


if __name__ == "__main__":
    print(json.dumps(RuntimePackageConfig.model_json_schema(), indent=2))
