from typing import Literal
import pytest


from src.core import logger
from src.utils import *
from src.types import (
    SuccessDataResponse,
)



@pytest.fixture
def invalid_question_payloads():
    # Values that should NOT work
    return [
        "question_data",
        ["A list of values of question data"],
        123,
        None,
    ]


def retrieve_single_file(client, qid, filename):
    resp = client.get(f"/questions/{qid}/files/{filename}")
    assert resp.status_code == 200, resp.text
    response_data = resp.json()
    validated = SuccessDataResponse.model_validate(response_data)
    return normalize_content(validated.data)


def retrieve_files(client, qid, route_arg: Literal["files", "files_data"]):
    resp = client.get(f"/questions/{qid}/{route_arg}")
    assert resp.status_code == 200, resp.text
    body = resp.json()


# ----------------------------------------------------------------------
# Fixtures
# ----------------------------------------------------------------------


@pytest.fixture
def create_multiple_question(test_client, all_question_payloads):
    """Ensure multiple question payloads can be created sequentially."""
    for p in all_question_payloads:
        serializable = to_serializable(p)
        data = {"question": json.dumps(serializable)}
        response = test_client.post("/questions/", data=data)
        assert response.status_code == 201
