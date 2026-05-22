import json
import os
from collections.abc import Sequence
from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from typing import Literal, Dict

from dotenv import load_dotenv
from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.core.exceptions import (
    CredentialConfigError,
    EmulatorConfigError,
    InvalidConfigError,
    MissingConfigError,
    MissingLangchainAPIKey,
    MissingStreamURl,
)

# General Settings
## ROOT Path points to root of the backend
ROOT_PATH = Path(__file__).parents[2]


class Environment(StrEnum):
    TESTING = "testing"
    DEV = "dev"
    PRODUCTION = "production"


APP_ENV = os.getenv("APP_ENV", "dev").lower()
ENV_FILES: Dict[str, str] = {
    "dev": ".env.dev",
    "testing": ".env.test",
    "production": ".env.production",
    "docker": ".env.docker",
}

# Check the env internally and attempts to resolve env file. Points to .env by default so this must always be set
env_file = ENV_FILES.get(APP_ENV, ".env.dev")
load_dotenv(env_file, override=False)


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
    LANGGRAPH_STREAM_URL: str | None = None
    LANGSMITH_API_KEY: str | None = None
    PROJECT_ROOT: str | Path

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str] | None = None):
        if v is None:
            return []

        raw_cors = [i.strip() for i in v.split(",")] if isinstance(v, str) else v

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
            raise CredentialConfigError(
                f"Failed to load firebase credentials: {e}"
            ) from e

    @model_validator(mode="after")
    def validate_emulators(self):
        if self.ENV == "production":
            return self

        if not (self.FIREBASE_AUTH_EMULATOR_HOST or self.STORAGE_EMULATOR_HOST):
            raise EmulatorConfigError(f"Missing emulator config for ENV={self.ENV}")

        return self

    @model_validator(mode="after")
    def validate_langchain_deployment(self):
        # Checks based on production
        if self.ENV == "production":
            if not self.LANGSMITH_API_KEY:
                raise MissingLangchainAPIKey(
                    "LANGSMITH_API_KEY is required when ENV=production."
                )
        if not self.LANGGRAPH_STREAM_URL:
            raise MissingStreamURl(
                f"LANGGRAPH_STREAM_URL is required but missing (ENV={self.ENV})."
            )

        return self

    # Determines which env file to use
    model_config = SettingsConfigDict(
        env_file=env_file,
        extra="ignore",
    )


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings(
        PROJECT_ROOT=ROOT_PATH,
    )


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
            message += f"{key.upper()}\n{value}\n{'*' * 50}\n"
    elif mode == "json":
        message = json.dumps(safe_settings, indent=2)

    return message


if __name__ == "__main__":
    print(get_settings_pretty_print())
