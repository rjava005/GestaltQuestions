import operator
from typing import Annotated, Generic, List, TypeVar

from langchain_core.documents import Document
from pydantic import BaseModel, Field

from .models import CodeArtifact, Question

SourceColumnT = TypeVar("SourceColumnT", bound=str)
TargetColumnT = TypeVar("TargetColumnT", bound=str)


class BaseGeneratorInput(BaseModel, Generic[SourceColumnT, TargetColumnT]):
    question: Question = Field(
        description="Payload containing all question content needed for generation."
    )
    prompt: str = Field(description="Base prompt used for generation.")
    question_html: str | None = Field(
        default=None,
        description="Optional rendered question HTML used as additional generation context.",
    )
    source_example_col: SourceColumnT = Field(
        description="Generic source column name used to retrieve examples."
    )
    target_example_col: TargetColumnT = Field(
        description="Generic target column name used to retrieve examples."
    )
    k: int = Field(
        default=2,
        description="Number of examples to retrieve.",
    )
    testing: bool = Field(
        default=False,
        description="Flag used to enable unit test behavior.",
    )


class BaseGeneratorState(BaseGeneratorInput):
    modified_prompt: str | None = Field(
        default=None,
        description="Modified prompt produced by the graph.",
    )
    formatted_examples: str | None = Field(
        default=None,
        description="Formatted examples retrieved for generation.",
    )
    retrieved_documents: Annotated[List[Document], operator.add] = Field(
        default_factory=list,
        description="Documents retrieved as generation examples.",
    )
    code: CodeArtifact | None = Field(
        default=None,
        description="Generated code artifact payload.",
    )
