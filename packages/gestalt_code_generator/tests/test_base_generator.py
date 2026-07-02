import os
from pathlib import Path

import pytest
from dotenv import load_dotenv
from langchain_core.vectorstores import InMemoryVectorStore
from gestalt_code_generator.vectorstore import build_vectorstore_from_csv
from gestalt_code_generator.graphs.base_generator import (
    Question,
)
from gestalt_code_generator.model import GeneratorContext
from gestalt_code_generator.graphs.base_generator import (
    graph as BaseGenerator,
)
from gestalt_code_generator.model.graph_models import BaseGeneratorInput, BaseGeneratorState

ENV_PATH = Path(__file__).resolve().parents[1] / "src" / ".env"
load_dotenv(ENV_PATH)

API_KEY = os.getenv("GOOGLE_API_KEY", None)
if not API_KEY:
    raise ValueError("GOOGLE API KEY must be set for test")


@pytest.fixture(scope="session")
def vectorstore(question_data_csv_path: Path) -> InMemoryVectorStore:
    return build_vectorstore_from_csv(question_data_csv_path)


@pytest.mark.parametrize(
    ("input_col", "output_col"),
    [
        ("question", "question.html"),
        ("question.html", "server.js"),
        ("question.html", "server.py"),
        ("question.html", "solution.html"),
    ],
)
def test_base_retriever(input_col, output_col, vectorstore):
    result = BaseGenerator.invoke(
        BaseGeneratorInput(
            question=Question(
                text="A car is traveling along a straight rode at a constant speed of 100mph for 5 hours what is the total distance covered"
            ),
            prompt=f"Generate a {output_col} file",
            source_example_col=input_col,
            target_example_col=output_col,
            testing=True,
        ),
        context=GeneratorContext(
            model="gemini-2.5-flash",
            model_provider="google_genai",
            vectorstore=vectorstore,
        ),
    )

    # Some basic checks
    parsed = BaseGeneratorState.model_validate(result)
    # Verify that the code was actually generated
    assert parsed.code
    assert parsed.code.filename == output_col
    assert parsed.code.content

    assert len(parsed.retrieved_documents) > 0
