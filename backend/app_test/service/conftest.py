import pytest
from app_test.shared.mock_data import (
    QUESTION_FULL,
    QUESTIONS,
    ADDITIONAL_METADATA,
    QUESTIONS_FULL,
)
from typing import List
from src.types import FileData


@pytest.fixture
def question_payload():
    """Full question payload including topics, qtypes, and languages."""
    return QUESTION_FULL

@pytest.fixture
def question_file_payload() -> List[FileData]:
    files_data = [
        ("question.html", "Some question text"),
        ("solution.html", "Some solution"),
        ("server.js", "some code content"),
        ("meta.json", {"content": "some content"}),
    ]
    return [FileData(filename=f[0], content=f[1]) for f in files_data]


