# Standard library imports
import os
import uvicorn
from contextlib import asynccontextmanager

# Third-party imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from src.api.core import logger

# Local application imports
from src.api.database.database import create_db_and_tables
from src.api.web import routes
from src.api.core.config import get_settings
from src.api.database.role import seed_roles
from src.api.database.database import Session


settings = get_settings()


## Intializes the database
@asynccontextmanager
async def on_startup(app: FastAPI):
    engine = create_db_and_tables()
    # Ensures that the roles are present at startup
    with Session(engine) as session:
        seed_roles(session)
        session.commit()
    yield


def add_routes(app: FastAPI, routes: list[APIRouter] = routes):
    for r in routes:
        app.include_router(r)


def get_application(test_mode: bool = False):
    app = FastAPI(title=settings.PROJECT_NAME, lifespan=on_startup)
    add_routes(app)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            str(origin) for origin in settings.BACKEND_CORS_ORIGINS
        ],  # allow specific frontend origins
        allow_credentials=True,  # allow cookies, Authorization headers
        allow_methods=["*"],  # allow all HTTP methods (GET, POST, etc.)
        allow_headers=["*"],  # allow all headers (including Authorization)
        expose_headers=["Content-Disposition"],
    )

    question_dir = Path(settings.ROOT_PATH) / settings.QUESTIONS_DIRNAME
    if not question_dir:
        raise ValueError("Cannot Find Local Path")

    logger.info(f"Setting Question Dir to {question_dir}")

    if not question_dir.exists():
        question_dir.mkdir(parents=True, exist_ok=True)

    app.mount(
        f"/{question_dir.name}",  # -> "/questions"
        StaticFiles(directory=question_dir, html=False),
        name="questions",
    )
    logger.info("Serving static files from: %s", question_dir)

    return app


app = get_application()


def main():
    uvicorn.run(
        "src.api.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )


if __name__ == "__main__":
    main()
