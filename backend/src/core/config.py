import os
from functools import lru_cache
from pathlib import Path
from typing import Literal, Sequence, List

from pydantic import field_validator, Field, AliasChoices, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import json


load_dotenv()

# General Settings
## ROOT Path points to root of the backend
ROOT_PATH = Path(__file__).parents[2]
ENV = os.getenv("ENV", "dev")
VALID_ENV = Literal["testing", "dev", "production"]
MODES: List[VALID_ENV] = ["dev", "production", "testing"]
ENV_FILE = f".env.{ENV}" if ENV != "production" else ".env"


class AppSettings(BaseSettings):
    PROJECT_NAME: str | None = "Gestalt"
    ENV: VALID_ENV = Field(default="dev", validation_alias=AliasChoices("MODE", "mode"))
    STORAGE_SERVICE: Literal["local", "cloud"] = "cloud"

    BACKEND_CORS_ORIGINS: Sequence[str] | str = []

    WORKING_DIR: str | Path | None = None

    DATABASE_URI: str | None = None
    POSTGRES_URL: str | None = None
    SQLITE_DB_PATH: str | None = None
    # FIREBASE CONFIG
    FIREBASE_CRED: str | None = None
    STORAGE_BUCKET: str | None = None
    # FIREBASE EMULATOR
    FIREBASE_AUTH_EMULATOR_HOST: str | None = None
    STORAGE_EMULATOR_HOST: str | None = None

    SANDBOX_URL: str | None = None
    PROJECT_ROOT: str | Path

    @field_validator("BACKEND_CORS_ORIGINS", mode="after")
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
    def validate_emulators(self):
        if self.ENV == "production":
            return self

        if not (self.FIREBASE_AUTH_EMULATOR_HOST or self.STORAGE_EMULATOR_HOST):
            raise ValueError(f"Missing emulator config for ENV={self.ENV}")

        return self

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        extra="ignore",
    )

    @field_validator("SQLITE_DB_PATH", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None):
        return v or ":memory:"


    @model_validator(mode="after")
    def format_credentials(self):
        try:
            if self.FIREBASE_CRED is None:
                raise ValueError("Firebase Credentials must be set")

            if self.ENV == "production":
                self.FIREBASE_CRED = json.loads(self.FIREBASE_CRED)
                return self

            cred_path = (Path(self.PROJECT_ROOT) / self.FIREBASE_CRED).resolve()

            if not cred_path.exists():
                raise ValueError(f"Credential file not found: {cred_path}")

            self.FIREBASE_CRED = json.loads(cred_path.read_text())

            return self

        except Exception as e:
            raise ValueError(f"Failed to load firebase credentials: {e}")


@lru_cache
def get_settings() -> AppSettings:
    if ENV not in MODES:
        raise ValueError(f"Invalid MODE: {ENV}. Must be one of {MODES}")
    app_settings = AppSettings(
        PROJECT_ROOT=ROOT_PATH,
    )
    return app_settings



if __name__ == "__main__":
    print(get_settings())
