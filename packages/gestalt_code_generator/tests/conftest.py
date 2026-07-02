from pathlib import Path

import pytest


@pytest.fixture(scope="session")
def question_data_csv_path() -> Path:
    return (
        Path(__file__).resolve().parents[1]
        / "src"
        / "gestalt_code_generator"
        / "data"
        / "QuestionDataV2_06122025_classified.csv"
    )
