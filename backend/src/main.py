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
from src.core import logger
from sqlmodel import Session

# Local application imports
from src.data import RoleManager, InstitutionDB
from src.web import ALL_ROUTES
from src.core import get_settings, create_db_and_tables


settings = get_settings()


## Intializes the database
@asynccontextmanager
async def on_startup(app: FastAPI):
    engine = create_db_and_tables()
    # Ensures that the roles are present at startup
    with Session(engine) as session:
        await RoleManager(session).seed_roles()
        logger.info("[Initialization] Roles Created/verified Successfully")
        session.commit()
        await InstitutionDB(session).seed_institution()

        logger.info("[Initialization]: Institution Created/Verified Succesfully")
    yield


def add_routes(app: FastAPI, routes: list[APIRouter] = ALL_ROUTES):
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

    question_dir = Path(settings.PROJECT_ROOT) / settings.QUESTIONS_DIRNAME
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
        "src.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )


if __name__ == "__main__":
    main()
