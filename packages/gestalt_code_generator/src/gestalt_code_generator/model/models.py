from typing import Literal

from pydantic import BaseModel, Field

CodeFilename = Literal["server.js", "server.py", "solution.html", "question.html"]
ExampleColumn = Literal[
    "question", "server.js", "server.py", "solution.html", "question.html"
]
ServerExampleColumn = Literal["server.js", "server.py"]
QuestionExampleColumn = Literal["question.html"]


class Question(BaseModel):
    text: str = Field(description="The question prompt or problem statement.")
    is_adaptive: bool = Field(
        default=True,
        description="Whether the question should adapt based on the user's response.",
    )
    solution_guide: str | None = Field(
        default=None,
        description="Optional guidance explaining how to solve the question.",
    )
    final_answer: str | None = Field(
        default=None,
        description="Optional final answer for the question.",
    )


class CodeArtifact(BaseModel):
    filename: CodeFilename | ExampleColumn = Field(
        description="The target filename or example column represented by this artifact."
    )
    content: str = Field(
        description="The source code or HTML content for the artifact."
    )
