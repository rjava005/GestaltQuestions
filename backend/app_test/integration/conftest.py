from collections.abc import Generator

import pytest

from app_test.conftest import storage_params
from backend.core import get_settings
from backend.storage import FbStorage, LocalStorage, Storage

settings = get_settings()


@pytest.fixture(params=storage_params())
def raw_storage(request: pytest.FixtureRequest) -> Generator[Storage]:
    if request.param == "cloud":
        request.getfixturevalue("firebase_app_for_tests")
        storage = FbStorage(settings.STORAGE_BUCKET)
        storage._hard_delete()
        yield storage
        storage._hard_delete()
        return

    yield LocalStorage()
