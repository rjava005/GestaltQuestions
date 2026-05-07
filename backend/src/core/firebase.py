from pathlib import Path
from firebase_admin import credentials
import firebase_admin
from functools import lru_cache
from src.core import get_settings
from src.core import logger

import os

app_settings = get_settings()
if app_settings.FIREBASE_AUTH_EMULATOR_HOST:
    os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = app_settings.FIREBASE_AUTH_EMULATOR_HOST
if app_settings.STORAGE_EMULATOR_HOST:
    os.environ["STORAGE_EMULATOR_HOST"] = app_settings.STORAGE_EMULATOR_HOST


@lru_cache
def initialize_firebase_app():
    try:
        try:
            return firebase_admin.get_app()
        except ValueError:
            pass

        cred = credentials.Certificate(app_settings.FIREBASE_CRED)

        return firebase_admin.initialize_app(
            cred, {"storageBucket": app_settings.STORAGE_BUCKET}
        )

    except Exception as e:
        logger.exception(
            "Firebase initialization failed. bucket=%s emulator=%s",
            app_settings.STORAGE_BUCKET,
            os.getenv("STORAGE_EMULATOR_HOST"),
        )
        raise ValueError(f"Could not initialize credentials: {e}") from e


if __name__ == "__main__":
    print("🔥 Firebase Mode:")
    print(app_settings.FIREBASE_AUTH_EMULATOR_HOST)
    print("Auth Emulator:", os.getenv("FIREBASE_AUTH_EMULATOR_HOST"))
    print("Storage Emulator:", os.getenv("STORAGE_EMULATOR_HOST"))
    fb = initialize_firebase_app()
    print(fb)
