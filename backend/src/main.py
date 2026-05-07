# Standard library imports
import os
import uvicorn
from contextlib import asynccontextmanager

# Third-party imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from src.core import logger
from sqlmodel import Session

# Local application imports
import src.data
from src.web import ALL_ROUTES
from src.core import get_settings, create_db_and_tables
from src.service.user.user_manager import RoleDB
from src.data.institution import InstitutionDB
from src.core.firebase import initialize_firebase_app

settings = get_settings()


## Intializes the database
@asynccontextmanager
async def on_startup(app: FastAPI):
    try:
        # Attempt to initialize firebase application
        initialize_firebase_app()
        engine = create_db_and_tables()
        # Ensures that the roles are present at startup
        with Session(engine) as session:
            await RoleDB(session).seed_roles()
            logger.info("[Initialization] Roles Created/verified Successfully")
            session.commit()
            await InstitutionDB(session).seed_institution()
            logger.info("[Initialization]: Institution Created/Verified Succesfully")
        yield
    except Exception as e:
        raise ValueError(f"Failed to initialize app {e}")

def add_routes(app: FastAPI, routes: list[APIRouter] = ALL_ROUTES):
    for r in routes:
        app.include_router(r)


def get_application(test_mode: bool = False):
    app = FastAPI(title=settings.PROJECT_NAME or "", lifespan=on_startup)
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
