from functools import lru_cache
from typing import Annotated
from fastapi import Depends


from src.core import SessionDep, logger
from src.core.config import AppSettings, get_settings
from src.data.question import QuestionDB
from src.service.storage.firebase_storage import FbStorage
from src.service.storage.local_storage import LocalStorage
from src.service.question_manager.question_manager import QuestionManager
from src.service.storage.local_storage import Storage
from src.app_types.general import STORAGE_TYPE
from src.data.institution import InstitutionDB
from src.service.question_query_service.question_query_service import (
    QuestionQueryService,
)


def get_app_settings() -> AppSettings:
    return get_settings()


SettingDependency = Annotated[AppSettings, Depends(get_app_settings)]


def get_storage_type(
    settings: SettingDependency,
) -> STORAGE_TYPE:
    return settings.STORAGE_SERVICE


StorageTypeDep = Annotated[STORAGE_TYPE, Depends(get_storage_type)]


def get_local_base_path(settings: SettingDependency):
    if settings == "local":
        return "questions"


LocalBaseDep = Annotated[str, Depends(get_local_base_path)]


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
