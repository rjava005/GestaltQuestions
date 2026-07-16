import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
import pytest
from fastapi.testclient import TestClient

from backend.api.deps import get_session, get_user_mng
from backend.auth import InstitutionDB, RoleDB, UserDB, UserManager
from src.main import get_application


@asynccontextmanager
async def on_startup_test(app: FastAPI):
    """Async startup context for tests (skips DB initialization)."""
    yield


@pytest.fixture(scope="function")
def user_manager(db_session):
    return UserManager(
        session=db_session,
        inst=InstitutionDB(db_session),
        rm=RoleDB(db_session),
        udb=UserDB(db_session),
    )


@pytest.fixture(scope="function")
def api_client(db_session, user_manager):
    asyncio.run(RoleDB(db_session).seed_roles())
    asyncio.run(InstitutionDB(db_session).seed_institution())

    app = get_application()
    # Skips initialization in main
    app.router.lifespan_context = on_startup_test

    # Dependency override
    def override_get_db():
        yield db_session

    def override_get_user_manager():
        return user_manager

    app.dependency_overrides[get_session] = override_get_db
    app.dependency_overrides[get_user_mng] = override_get_user_manager

    with TestClient(app, raise_server_exceptions=True) as client:
        yield client

    app.dependency_overrides.clear()


# settings = get_settings()


# @pytest.fixture(scope="session")
# def firebase_app_for_tests():
#     assert os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"), (
#         "Missing FIREBASE_AUTH_EMULATOR_HOST"
#     )
#     assert os.environ.get("STORAGE_EMULATOR_HOST"), "Missing STORAGE_EMULATOR_HOST"

#     app = initialize_firebase_app()
#     yield app

#     with suppress(Exception):
#         firebase_admin.delete_app(app)
#     initialize_firebase_app.cache_clear()


# @pytest.fixture(
#     params=[
#         ("local", LocalStorage),
#         ("cloud", FbStorage),
#     ]
# )
# def storage(request, firebase_app_for_tests):
#     _, StorageClass = request.param

#     if StorageClass is FbStorage:
#         return StorageClass(settings.STORAGE_BUCKET)
#     return StorageClass()


# @pytest.fixture(autouse=True)
# def clean_cloud(storage) -> None:
#     if storage.get_storage_type() == "cloud":
#         storage._hard_delete()


# @pytest.fixture
# def question_manager(storage, question_db):
#     return QuestionManager(question_db, storage)


# @pytest.fixture(scope="function")
# def api_client(db_session, question_manager, storage, tmp_path):
#     """
#     Provides a FastAPI TestClient with dependency overrides for DB, storage,
#     question manager, and resource service.
#     """
#     app = get_application()
#     app.router.lifespan_context = on_startup_test

#     # --- Dependency overrides ---
#     def override_get_db():
#         yield db_session

#     async def override_get_question_manager():
#         yield question_manager

#     async def override_get_storage():
#         yield storage

#     async def override_storage_mode():
#         yield storage.get_storage_type()

#     async def override_local_base_path():
#         yield (tmp_path / "test_questions").as_posix()

#     app.dependency_overrides[get_session] = override_get_db
#     app.dependency_overrides[get_question_manager] = override_get_question_manager
#     app.dependency_overrides[get_storage_manager] = override_get_storage
#     app.dependency_overrides[get_storage_type] = override_storage_mode
#     app.dependency_overrides[get_local_base_path] = override_local_base_path

#     # --- Start test client ---
#     with TestClient(app, raise_server_exceptions=True) as client:
#         yield client


# @pytest.fixture
# def server_files():
#     """Static assets used by question endpoints."""
#     base = Path("app_test/test_assets/code")
#     return [
#         FileData(filename="server.js", content=(base / "generate.js").read_bytes()),
#         FileData(filename="server.py", content=(base / "generate.py").read_bytes()),
#     ]
