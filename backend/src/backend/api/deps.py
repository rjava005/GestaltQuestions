from functools import lru_cache
from typing import Annotated, Literal

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin.auth import verify_id_token
from sqlmodel import Session
from starlette import status

from backend.auth import (
    DeveloperAccessService,
    InstitutionDB,
    RoleDB,
    UserDB,
    UserManager,
)
from backend.chat.service.thread import MessageDB, ThreadDB
from backend.core import logger
from backend.core.config import AppSettings, get_settings
from backend.database import get_session
from backend.question import QuestionDB, QuestionQueryService
from backend.question_manager import DeveloperQuestionService, QuestionManager
from backend.question_runtime.service.question_runtime import QuestionRunTimeService
from backend.question_runtime.service.runtime_db import QuestionRuntimeDB
from backend.question_runtime.service.runtime_sync import QuestionRunTimeSyncService
from backend.question_views.service.table_query_service import TableQueryService
from backend.sandbox_client import SandboxClient
from backend.storage import STORAGE_TYPE, FbStorage, LocalStorage, Storage

# Core dependencies
SessionDep = Annotated[Session, Depends(get_session)]


def get_app_settings() -> AppSettings:
    return get_settings()


SettingDependency = Annotated[AppSettings, Depends(get_app_settings)]


def get_storage_type(
    settings: SettingDependency,
) -> Literal["cloud", "local"]:
    return settings.STORAGE_SERVICE


StorageTypeDep = Annotated[STORAGE_TYPE, Depends(get_storage_type)]


# Question dependencies
def get_question_database(
    session: SessionDep,
) -> QuestionDB:
    return QuestionDB(session)


QuestionDBDependency = Annotated[QuestionDB, Depends(get_question_database)]


def get_question_query(
    session: SessionDep,
) -> QuestionQueryService:
    return QuestionQueryService(session)


QuestionQueryDependency = Annotated[QuestionQueryService, Depends(get_question_query)]


def get_table_query_service(
    session: SessionDep,
) -> TableQueryService:
    return TableQueryService(session)


TableQueryDependency = Annotated[TableQueryService, Depends(get_table_query_service)]


# Storage dependencies
@lru_cache
def get_storage_manager() -> Storage:
    settings = get_settings()
    if settings.STORAGE_SERVICE == "cloud":
        if not (settings.FIREBASE_CRED and settings.STORAGE_BUCKET):
            raise ValueError("Settings for Cloud Storage not Set")
        storage_service = FbStorage(
            bucket=settings.STORAGE_BUCKET,
        )
    else:
        storage_service = LocalStorage()

    logger.debug(f"Question manager set to {settings.STORAGE_SERVICE}")
    logger.debug("Initialized Question Manager Success")

    return storage_service


StorageDependency = Annotated[Storage, Depends(get_storage_manager)]


# Authentication dependencies
bearer_scheme = HTTPBearer(auto_error=False)


def get_firebase_token(
    token: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict | None:
    try:
        if not token:
            raise ValueError("No Token")
        return verify_id_token(token.credentials)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Not logged in or Invalid credentials {e!s}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


FireBaseToken = Annotated[dict, Depends(get_firebase_token)]


# User dependencies
def get_user_mng(session: SessionDep) -> UserManager:
    return UserManager(
        session=session,
        inst=InstitutionDB(session),
        rm=RoleDB(session),
        udb=UserDB(session),
    )


def get_current_user_id(
    token: FireBaseToken,
) -> str:
    try:
        user_id = token.get("user_id", None)
        if user_id is None:
            raise HTTPException(
                detail="Failed to retrieve signed in user",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            detail=f"Failed to retrieve signed in user {e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ) from e


UserManagerDependeny = Annotated[UserManager, Depends(get_user_mng)]
CurrentUser = Annotated[str, Depends(get_current_user_id)]


# Developer dependencies
def get_developer_access(
    session: SessionDep, user_manager: UserManagerDependeny, storage: StorageDependency
) -> DeveloperAccessService:
    return DeveloperAccessService(
        user_manager=user_manager, storage=storage, session=session
    )


def get_question_manager(
    storage: StorageDependency,
    question_db: QuestionDBDependency,
) -> QuestionManager:
    return QuestionManager(storage=storage, qdb=question_db)


QuestionManagerDependency = Annotated[QuestionManager, Depends(get_question_manager)]

DeveloperAccess = Annotated[DeveloperAccessService, Depends(get_developer_access)]


# Question manager dependencies
def get_dev_question_manager(
    session: SessionDep,
    qm: QuestionManagerDependency,
    dev_access: DeveloperAccess,
) -> DeveloperQuestionService:

    return DeveloperQuestionService(
        session=session, developer_access=dev_access, question_manager=qm
    )


DeveloperQuestionManagerDependency = Annotated[
    DeveloperQuestionService, Depends(get_dev_question_manager)
]


# Runtime dependencies
def get_sandbox(app_settings: SettingDependency) -> SandboxClient:
    return SandboxClient(base_url=app_settings.SANDBOX_URL)


SandboxDependency = Annotated[SandboxClient, Depends(get_sandbox)]


# Thread dependencies
def get_thread_db(session: SessionDep) -> ThreadDB:
    logger.debug("Initialized Thread DB")
    return ThreadDB(session)


ThreadDBDependency = Annotated[ThreadDB, Depends(get_thread_db)]


def get_message_db(session: SessionDep) -> MessageDB:
    logger.debug("Initialized Message DB")
    return MessageDB(session)


MessageDBDependency = Annotated[MessageDB, Depends(get_message_db)]


def get_qruntime(session: SessionDep):
    return QuestionRuntimeDB(session)


QuestionRuntimeDBDependency = Annotated[QuestionRuntimeDB, Depends(get_qruntime)]


def get_question_runtime_service(
    qm: QuestionManagerDependency,
    runtime_db: QuestionRuntimeDBDependency,
    sandbox: SandboxDependency,
) -> QuestionRunTimeService:
    return QuestionRunTimeService(qm, runtime_db, sandbox)


QuestionRuntimeServiceDependency = Annotated[
    QuestionRunTimeService, Depends(get_question_runtime_service)
]


def get_runtime_sync(runtime_db: QuestionRuntimeDBDependency):
    return QuestionRunTimeSyncService(runtime_db)


QuestionRuntimeSyncDependency = Annotated[
    QuestionRunTimeSyncService, Depends(get_runtime_sync)
]
