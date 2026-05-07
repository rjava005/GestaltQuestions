
from typing import Annotated, Generator

from fastapi import Depends
from sqlmodel import SQLModel, Session, create_engine
from src.core import get_settings, logger

app_settings = get_settings()


# Define choosing the settings
if app_settings.ENV == "testing":
    DATABASE_URL = "sqlite:///:memory:"
elif app_settings.ENV == "production":
    DATABASE_URL = app_settings.POSTGRES_URL
    if not DATABASE_URL:
        raise RuntimeError("POSTGRES_URL must be set in production mode")
elif app_settings.ENV == "dev":
    DATABASE_URL = app_settings.POSTGRES_URL
else:
    raise ValueError(f"Unknown environment: {app_settings.ENV}")


logger.debug(f"[DATABASE Intialization]: Database path set to {DATABASE_URL}")

try:
    connect_args = {}
    if not DATABASE_URL:
        raise ValueError("DATABASE URL is set to None")
    engine = create_engine(
        url=DATABASE_URL,
        echo=True,
        connect_args=connect_args,  # always a dict, never None
    )
    Base = SQLModel
except Exception as e:
    raise RuntimeError(f"Error initializing database engine {e}")


def create_db_and_tables(engine=engine):
    Base.metadata.create_all(engine)
    return engine


def get_session() -> Generator[Session, None, None]:
    """Yield a SQLModel session per request."""
    with Session(engine, expire_on_commit=False) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]


if __name__ == "__main__":
    create_db_and_tables()
