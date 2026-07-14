import contextlib
import os
from collections.abc import Generator
from pathlib import Path
from typing import Any

import firebase_admin
import pytest

from backend.core import get_settings, initialize_firebase_app
from backend.question import QType, QuestionCreate, QuestionDB
from backend.question_manager.services.manager import QuestionManager
from backend.storage import FbStorage, FileData, LocalStorage, Storage

settings = get_settings()


def _normalize_storage_emulator_host() -> bool:
    host = os.environ.get("STORAGE_EMULATOR_HOST")
    if not host or host == "...":
        return False

    if not host.startswith(("http://", "https://")):
        os.environ["STORAGE_EMULATOR_HOST"] = f"http://{host}"

    return True


def _storage_params() -> list[str]:
    firebase_enabled = (
        os.environ.get("RUN_FIREBASE_STORAGE_TESTS") == "1"
        and os.environ.get("FIREBASE_AUTH_EMULATOR_HOST")
        and _normalize_storage_emulator_host()
    )
    if firebase_enabled:
        return ["local", "cloud"]
    return ["local"]


@pytest.fixture(scope="session")
def firebase_app_for_tests() -> Generator[Any]:
    if "cloud" not in _storage_params():
        pytest.skip("Firebase storage emulator is not configured.")

    app = initialize_firebase_app()
    yield app

    with contextlib.suppress(Exception):
        firebase_admin.delete_app(app)
    initialize_firebase_app.cache_clear()


@pytest.fixture(params=_storage_params())
def raw_storage(request: pytest.FixtureRequest) -> Storage:
    if request.param == "cloud":
        request.getfixturevalue("firebase_app_for_tests")
        return FbStorage(settings.STORAGE_BUCKET) # type: ignore
    return LocalStorage()


@pytest.fixture(autouse=True)
def clean_cloud(raw_storage: Storage) -> None:
    if raw_storage.get_storage_type() == "cloud":
        raw_storage._hard_delete()  # type: ignore[attr-defined]


@pytest.fixture
def question_manager(
    raw_storage: Storage,
    question_db: QuestionDB,
) -> QuestionManager:
    return QuestionManager(storage=raw_storage, qdb=question_db)


@pytest.fixture
def storage_base_path(raw_storage: Storage, tmp_path: Path) -> str:
    if raw_storage.get_storage_type() == "local":
        return (tmp_path / "developers" / "user-1").as_posix()
    return "developers/user-1"


@pytest.fixture
def question_payload() -> QuestionCreate:
    return QuestionCreate(
        title="Bernoulli Equation",
        topics=["fluid-dynamics"],
        qType=[QType.MC],
        ai_generated=False,
        isAdaptive=False,
    )


@pytest.fixture
def question_files() -> list[FileData]:
    return [
        FileData(filename="question.html", content="<p>Question</p>"),
        FileData(filename="solution.html", content="<p>Solution</p>"),
        FileData(filename="meta.json", content={"difficulty": "easy"}),
    ]
