import pytest
from src.types import QuestionData
from uuid import UUID
from pathlib import Path
import mimetypes
from src.model.question import Question

ASSETS_DIR = Path("app_test/shared/test_assets/uploads")


@pytest.fixture
def make_question_web(api_client):
    def make(**overrides):
        defaults = {
            "title": "Sample Question",
            "ai_generated": True,
            "isAdaptive": False,
        }

        data = QuestionData(**(defaults | overrides))
        return api_client.post("/questions/", data=data.model_dump_json())

    return make


@pytest.fixture
def make_question_with_files(api_client):
    def make(
        *,
        overrides: dict | None = None,
        files: list[Path] | None = None,
        auto_handle_images: bool = True,
    ):
        defaults = {
            "title": "Sample Question",
            "ai_generated": True,
            "isAdaptive": False,
        }

        data = QuestionData(**(defaults | (overrides or {})))

        file_paths = files or list(ASSETS_DIR.iterdir())

        multipart_files = []
        opened_files = []

        try:
            for path in file_paths:
                f = path.open("rb")
                opened_files.append(f)
                multipart_files.append(
                    (
                        "files",
                        (path.name, f, mimetypes.guess_type(path.name)[0]),
                    )
                )

            response = api_client.post(
                f"/questions/files/?auto_handle_images={str(auto_handle_images).lower()}",
                files=multipart_files,
                data={"question_data": data.model_dump_json()},
            )

            return response,file_paths

        finally:
            for f in opened_files:
                f.close()

    return make


@pytest.fixture
def make_upload_files_to_question(
    make_question_web,
    api_client,
):
    def make(
        *,
        question=None,
        question_payload: dict | None = None,
        files: list[Path] | None = None,
        auto_handle_images: bool = True,
    ):
        if not question:
            payload = question_payload or {}
            response = make_question_web(**payload)
            question = response.json()

        question = Question.model_validate(question)
        assert question
        file_paths = files or ASSETS_DIR.iterdir()
        multipart_files = []
        opened_files = []

        try:
            for path in file_paths:
                f = path.open("rb")
                opened_files.append(f)
                multipart_files.append(
                    (
                        "files",
                        (path.name, f, mimetypes.guess_type(path.name)[0]),
                    )
                )

            response = api_client.post(
                f"/questions/files/{str(question.id)}?auto_handle_images={str(auto_handle_images).lower()}",
                files=multipart_files,
            )
            return response

        finally:
            for f in opened_files:
                f.close()

    return make


@pytest.fixture
def make_bad_question_web(api_client):
    def make(**overrides):
        defaults = {"missing": "data", "another": "bad_key"}
        data = {**defaults | overrides}
        return api_client.post("/questions/", json=data)

    return make


@pytest.fixture
def make_retrieve_question(api_client):
    def make(qid: str | UUID):
        return api_client.get(f"/questions/{qid}")

    return make


@pytest.fixture
def make_delete_question(api_client):
    def make(qid: str | UUID):
        return api_client.delete(f"/questions/{qid}")

    return make


@pytest.fixture
def make_retrieve_question_full(api_client):
    def make(qid: str | UUID):
        return api_client.get(f"/questions/{qid}/all_data")

    return make
