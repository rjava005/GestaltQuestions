"""Initialize the current schema when local development starts with an empty DB."""

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlmodel import SQLModel

# Import every table model before calling create_all.
from backend.auth import model as auth_models  # noqa: F401
from backend.chat import model as chat_models  # noqa: F401
from backend.core.config import ROOT_PATH
from backend.database import engine
from backend.question import models as question_models  # noqa: F401
from backend.question_attempt import model as attempt_models  # noqa: F401
from backend.question_runtime import model as runtime_models  # noqa: F401
from backend.storage import model as storage_models  # noqa: F401

PRE_VIEW_REVISION = "745cf53cb744"


def bootstrap_empty_database() -> bool:
    """Create current tables and establish an Alembic baseline if DB is empty."""
    if inspect(engine).get_table_names():
        return False

    SQLModel.metadata.create_all(engine)

    alembic_config = Config(str(ROOT_PATH / "alembic.ini"))
    alembic_config.set_main_option(
        "script_location", str(ROOT_PATH / "migrations")
    )
    command.stamp(alembic_config, PRE_VIEW_REVISION)
    return True


if __name__ == "__main__":
    created = bootstrap_empty_database()
    print("Initialized empty database" if created else "Database already initialized")
