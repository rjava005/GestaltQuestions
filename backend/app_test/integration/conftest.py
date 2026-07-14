import contextlib
import os
from collections.abc import Generator
from typing import Any

import firebase_admin
import pytest

from backend.core import get_settings, initialize_firebase_app
from backend.storage import FbStorage, LocalStorage, Storage

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
def raw_storage(request: pytest.FixtureRequest) -> Generator[Storage]:
    if request.param == "cloud":
        request.getfixturevalue("firebase_app_for_tests")
        storage = FbStorage(settings.STORAGE_BUCKET)
        storage._hard_delete()
        yield storage
        storage._hard_delete()
        return

    yield LocalStorage()
