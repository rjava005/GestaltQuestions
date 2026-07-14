from typing import Any

from pydantic import BaseModel, Field


class QuizData(BaseModel):
    params: dict[str, Any]
    correct_answers: dict[str, Any]
    logs: list[Any] = Field(default_factory=list)
    nDigits: int | None = 3
    sigfigs: int | None = 3

    model_config = {"extra": "allow"}
