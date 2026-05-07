from src.core import logger
from app_test.shared.mock_data import QUESTIONS
from src.model.question import Question
import pytest
from pathlib import Path


@pytest.mark.parametrize("payload", QUESTIONS)
def test_make_question_with_files(make_question_with_files, payload):
    response, _ = make_question_with_files(overrides=payload)
    assert response.status_code == 200
    assert Question.model_validate(response.json())


@pytest.mark.parametrize("payload", QUESTIONS)
def test_upload_files_to_question(payload, make_upload_files_to_question):
    response = make_upload_files_to_question(question_payload=payload)
    assert response.status_code == 200

# TODO Fix the question manager
# @pytest.mark.parametrize("payload", QUESTIONS)
# def test_get_question_file_names(make_question_with_files, payload, api_client):
#     response, file_paths = make_question_with_files(overrides=payload)
#     question = Question.model_validate(response.json())
#     assert question
#     rfiles = api_client.get(f"/questions/files/{str(question.id)}").json()
#     logger.info(f"Retrieved files {rfiles}")
#     expected_names = {Path(p).name for p in file_paths}
#     returned_names = {Path(r).name for r in rfiles}
#     assert returned_names == expected_names


@pytest.mark.parametrize("payload", QUESTIONS)
def test_get_filedata(make_question_with_files, payload, api_client):
    response, _ = make_question_with_files(overrides=payload)
    question = Question.model_validate(response.json())
    res = api_client.get(f"/questions/files/filedata/{str(question.id)}")
    rfiles = res.json()
    logger.info(f"Retrieved files {rfiles}")
    assert res.status_code == 200
