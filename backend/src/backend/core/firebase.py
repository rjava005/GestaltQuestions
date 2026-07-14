import os
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials

from .config import get_settings
from .exceptions import FirebaseInitializationError, MissingConfigError
from .logging import logger

app_settings = get_settings()


@lru_cache
def initialize_firebase_app():

    try:
        if firebase_admin._apps:
            return firebase_admin.get_app()

        if not app_settings.FIREBASE_CRED:
            raise MissingConfigError(
                "FIREBASE_CRED must be configured before Firebase initialization"
            )

        # -----------------------------
        # Handle Emulator Mode
        # -----------------------------
        if app_settings.ENV == "production":
            os.environ.pop("FIREBASE_AUTH_EMULATOR_HOST", None)
            os.environ.pop("STORAGE_EMULATOR_HOST", None)

        else:
            # ensure dev env vars exist
            if not app_settings.FIREBASE_AUTH_EMULATOR_HOST:
                raise FirebaseInitializationError(
                    "FIREBASE_AUTH_EMULATOR_HOST must be set in dev"
                )

            if not app_settings.STORAGE_EMULATOR_HOST:
                raise FirebaseInitializationError(
                    "STORAGE_EMULATOR_HOST must be set in dev"
                )

        # -----------------------------
        # Load credentials
        # -----------------------------
        cred = credentials.Certificate(app_settings.FIREBASE_CRED)

        # -----------------------------
        # Initialize Firebase
        # -----------------------------
        bucket_name = app_settings.STORAGE_BUCKET

        if not bucket_name:
            raise MissingConfigError("STORAGE_BUCKET must be defined")

        firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})

        return firebase_admin.get_app()
    except MissingConfigError:
        raise
    except Exception as e:
        logger.exception(
            "Firebase initialization failed. bucket=%s emulator=%s",
            app_settings.STORAGE_BUCKET,
            os.getenv("STORAGE_EMULATOR_HOST"),
        )
        raise FirebaseInitializationError(
            f"Could not initialize firebase app: {e}"
        ) from e


if __name__ == "__main__":
    fb = initialize_firebase_app()
    print(fb)
