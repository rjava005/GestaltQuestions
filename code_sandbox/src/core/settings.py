from typing import Literal, Sequence
import os
from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    PROJECT_NAME: str | None = "Sandbox"
    MODE: Literal["testing", "dev", "production"] = "dev"

    BACKEND_CORS_ORIGINS: Sequence[str] | str = []

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


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()


if __name__ == "__main__":
    print(get_settings())
