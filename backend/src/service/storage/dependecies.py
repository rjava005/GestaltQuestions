from fastapi import Depends
from src.core import logger
from src.core.config import get_settings
from . import FirebaseStorage, LocalStorageService, StorageService
from typing import Annotated

settings = get_settings()


def get_storage_manager() -> StorageService:
    if settings.STORAGE_SERVICE == "cloud":
        if not (settings.FIREBASE_CRED and settings.STORAGE_BUCKET):
            raise ValueError("Settings for Cloud Storage not Set")
        storage_service = FirebaseStorage(
            root="/gestaltQuestions", base="questions", bucket=settings.STORAGE_BUCKET
        )
    else:

        storage_service = LocalStorageService(str(settings.PROJECT_ROOT), "questions")
    logger.debug(f"Question manager set to {settings.STORAGE_SERVICE}")
    logger.debug("Initialized Question Manager Success ")
    return storage_service


StorageDependency = Annotated[StorageService, Depends(get_storage_manager)]
