import os
from functools import lru_cache
from pathlib import Path
from typing import Literal, Sequence
from enum import Enum
from pydantic import field_validator, Field, AliasChoices, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import json
from src.core.exceptions import (
    CredentialConfigError,
    EmulatorConfigError,
    InvalidConfigError,
    MissingConfigError,
)

# General Settings
## ROOT Path points to root of the backend
ROOT_PATH = Path(__file__).parents[2]


class Environment(str, Enum):
    TESTING = "testing"
    DEV = "dev"
    PRODUCTION = "production"


# Check the env internally and attempts to resolve env file. Points to .env by default so this must always be set
env = os.getenv("ENV", "dev")
ENV_FILE = f".env.{env}" if env != "production" else ".env"
load_dotenv(ENV_FILE)


class AppSettings(BaseSettings):
    PROJECT_NAME: str | None = "Gestalt"
    ENV: Environment = Field(
        default=Environment.DEV, validation_alias=AliasChoices("MODE", "mode")
    )
    STORAGE_SERVICE: Literal["local", "cloud"] = "cloud"

    # Allowed origins for http request
    BACKEND_CORS_ORIGINS: Sequence[str] | str = []

    DATABASE_URL: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "POSTGRES_URL", "postgres_url", "database_url", "DATABASE_URL"
        ),
    )
    # FIREBASE CONFIG
    FIREBASE_CRED: str | None = None
    STORAGE_BUCKET: str | None = None
    # FIREBASE EMULATOR
    FIREBASE_AUTH_EMULATOR_HOST: str | None = None
    STORAGE_EMULATOR_HOST: str | None = None

    SANDBOX_URL: str | None = None
    PROJECT_ROOT: str | Path

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str] | None = None):
        if v is None:
            return []

        if isinstance(v, str):
            raw_cors = [i.strip() for i in v.split(",")]
        else:
            raw_cors = v

        normalized = []
        for r in raw_cors:
            if not r.startswith(("http://", "https://")):
                r = "http://" + r
            normalized.append(r)

        return normalized

    @model_validator(mode="after")
    def validate_database(self):
        # if not self.DATABASE_URL:
        #     raise ValueError("Database URL is not set")
        return self

    # Firebase set up
    @model_validator(mode="after")
    def format_credentials(self):
        try:
            if self.FIREBASE_CRED is None:
                raise MissingConfigError("FIREBASE_CRED must be set")
            if self.ENV == "production":
                self.FIREBASE_CRED = json.loads(self.FIREBASE_CRED)
                return self
            cred_path = (Path(self.PROJECT_ROOT) / self.FIREBASE_CRED).resolve()
            if not cred_path.exists():
                raise CredentialConfigError(f"Credential file not found: {cred_path}")
            self.FIREBASE_CRED = json.loads(cred_path.read_text())
            return self
        except (MissingConfigError, CredentialConfigError):
            raise
        except json.JSONDecodeError as e:
            raise InvalidConfigError(
                "FIREBASE_CRED contains invalid JSON payload"
            ) from e
        except Exception as e:
            raise CredentialConfigError(f"Failed to load firebase credentials: {e}") from e

    @model_validator(mode="after")
    def validate_emulators(self):
        if self.ENV == "production":
            return self

        if not (self.FIREBASE_AUTH_EMULATOR_HOST or self.STORAGE_EMULATOR_HOST):
            raise EmulatorConfigError(f"Missing emulator config for ENV={self.ENV}")

        return self

    # Determines which env file to use
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        extra="ignore",
    )


@lru_cache
def get_settings() -> AppSettings:
    app_settings = AppSettings(
        PROJECT_ROOT=ROOT_PATH,
    )
    return app_settings


@lru_cache
def get_settings_pretty_print(mode: Literal["str", "json"] = "json") -> str:
    app_settings = get_settings()

    safe_settings = {
        "project_name": app_settings.PROJECT_NAME,
        "environment": app_settings.ENV.value,
        "storage_service": app_settings.STORAGE_SERVICE,
        "deployment": {
            "is_production": app_settings.ENV == Environment.PRODUCTION,
            "uses_emulators": bool(
                app_settings.FIREBASE_AUTH_EMULATOR_HOST
                or app_settings.STORAGE_EMULATOR_HOST
            ),
        },
        "cors": {
            "origins_count": len(app_settings.BACKEND_CORS_ORIGINS),
            "origins": list(app_settings.BACKEND_CORS_ORIGINS),
        },
        "services_configured": {
            "database": bool(app_settings.DATABASE_URL),
            "firebase_credentials": bool(app_settings.FIREBASE_CRED),
            "storage_bucket": bool(app_settings.STORAGE_BUCKET),
            "sandbox_url": bool(app_settings.SANDBOX_URL),
        },
    }

    if mode == "str":
        message = ""
        for key, value in safe_settings.items():
            message += f"{key.upper()}\n{value}\n{'*'*50}\n"
    elif mode == "json":
        message = json.dumps(safe_settings, indent=2)

    return message


if __name__ == "__main__":
    print(get_settings_pretty_print())
