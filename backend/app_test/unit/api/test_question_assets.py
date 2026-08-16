from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException

from backend.api.run_question.run_question import (
    QuestionRunRequest,
    read_question_asset,
    run,
)


class StubQuestionManager:
    def __init__(self, files: dict[str, bytes]) -> None:
        self.files = files

    async def read_file(self, _qid: UUID, filename: str) -> bytes | None:
        return self.files.get(filename)


@pytest.mark.asyncio
async def test_question_asset_serves_json() -> None:
    manager = StubQuestionManager({"circuit.json": b'{"version": 1}'})

    response = await read_question_asset(uuid4(), "circuit.json", manager)

    assert response.media_type == "application/json"
    assert response.body == b'{"version": 1}'


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "filename",
    ["../server.py", "folder\\circuit.json", "server.js", "question.html"],
)
async def test_question_asset_rejects_unsafe_or_unsupported_files(
    filename: str,
) -> None:
    manager = StubQuestionManager({filename: b"secret"})

    with pytest.raises(HTTPException) as error:
        await read_question_asset(uuid4(), filename, manager)

    assert error.value.status_code == 404


@pytest.mark.asyncio
async def test_question_asset_keeps_image_support() -> None:
    manager = StubQuestionManager({"diagram.png": b"png"})

    response = await read_question_asset(uuid4(), "diagram.png", manager)

    assert response.media_type == "image/png"
    assert response.body == b"png"


@pytest.mark.asyncio
async def test_run_forwards_optional_generation_context() -> None:
    class StubRuntimeService:
        async def run(
            self, qid: UUID, language: object, generation_context: object
        ) -> object:
            return qid, language, generation_context

    qid = uuid4()
    result = await run(
        qid=qid,
        runtime_service=StubRuntimeService(),  # type: ignore[arg-type]
        language=None,
        request=QuestionRunRequest(previousCircuitVariant="lowPass"),
    )

    assert result == (qid, None, {"previousCircuitVariant": "lowPass"})
