from pydantic import BaseModel, Field


class BinaryResponse(BaseModel):
    binary: bool


class GeneralResponse(BaseModel):
    response: str


class QuestionImageAnalysis(BaseModel):
    intent: str
    requires_image: bool


class CodeResponse(BaseModel):
    code: str = Field(description="The generated code response.")
