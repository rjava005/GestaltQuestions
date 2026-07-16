from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from backend.core import get_settings, logger

from .exceptions import (
    DatabaseConfigError,
    DatabaseInitializationError,
)

app_settings = get_settings()


# Define choosing the settings
if app_settings.ENV == "testing":
    DATABASE_URL = "sqlite:///:memory:"
elif app_settings.ENV == "production" or app_settings.ENV == "dev":
    DATABASE_URL = app_settings.DATABASE_URL
else:
    raise DatabaseConfigError(f"Unknown environment: {app_settings.ENV}")

if not DATABASE_URL:
    raise DatabaseConfigError("DATABASE_URL must be set in production mode")

logger.debug(f"[DATABASE Intialization]: Database path set to {DATABASE_URL}")

try:
    connect_args = {}
    engine = create_engine(
        url=DATABASE_URL,
        echo=True,
        connect_args=connect_args,  # always a dict, never None
    )
    Base = SQLModel
except DatabaseConfigError:
    raise
except Exception as e:
    raise DatabaseInitializationError(f"Error initializing database engine {e}") from e


def create_db_and_tables(engine=engine):
    Base.metadata.create_all(engine)
    return engine


def get_session() -> Generator[Session, None, None]:
    """Yield a SQLModel session per request."""
    with Session(engine, expire_on_commit=False) as session:
        yield session


if __name__ == "__main__":
    from sqlalchemy import text

    print(DATABASE_URL)
    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Database connection successful")
            print(result.scalar())

    except Exception as e:
        print("Database connection failed")
        print(e)
