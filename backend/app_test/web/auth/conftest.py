import asyncio
from collections.abc import Generator
from contextlib import asynccontextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app_test.conftest import storage_params
from backend.api.deps import (
    get_developer_access,
    get_session,
    get_storage_manager,
    get_storage_type,
    get_user_mng,
)
from backend.auth import DeveloperAccessService, InstitutionDB, RoleDB
from backend.core import get_settings
from backend.storage import FbStorage, LocalStorage, Storage
from src.main import get_application

settings = get_settings()


@asynccontextmanager
async def on_startup_test(app: FastAPI):
    yield


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


@pytest.fixture(scope="function")
def api_client(db_session, user_manager, raw_storage):
    asyncio.run(RoleDB(db_session).seed_roles())
    asyncio.run(InstitutionDB(db_session).seed_institution())

    app = get_application()
    app.router.lifespan_context = on_startup_test

    def override_get_db():
        yield db_session

    def override_get_user_manager():
        return user_manager

    def override_get_developer_access():
        return DeveloperAccessService(
            user_manager=user_manager,
            storage=raw_storage,
            session=db_session,
        )

    def override_get_storage():
        return raw_storage

    def override_get_storage_type():
        return raw_storage.get_storage_type()

    app.dependency_overrides[get_session] = override_get_db
    app.dependency_overrides[get_user_mng] = override_get_user_manager
    app.dependency_overrides[get_developer_access] = override_get_developer_access
    app.dependency_overrides[get_storage_manager] = override_get_storage
    app.dependency_overrides[get_storage_type] = override_get_storage_type

    with TestClient(app, raise_server_exceptions=True) as client:
        yield client

    app.dependency_overrides.clear()
