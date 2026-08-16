# Standard library imports
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import UUID

import uvicorn

# Third-party imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from sqlmodel import Session, select

from backend.api import ALL_ROUTES
from backend.auth import DeveloperProfile, InstitutionDB, RoleDB, User, UserRoles
from backend.core import get_settings, initialize_firebase_app, logger
from backend.database import engine
from backend.question import QuestionQTypeDB
from backend.question_runtime.service.instance_db import QuestionInstanceDB

settings = get_settings()


async def seed_database(session: Session) -> None:
    await RoleDB(session).seed_roles()
    logger.info("[Initialization] Roles Created/verified Successfully")
    await InstitutionDB(session).seed_institution()
    logger.info("[Initialization] Institution Created/verified Successfully")
    QuestionQTypeDB(session).seed_types()
    logger.info("[Initialization] QuestionQTypeDB Created/verified Successfully")
    if settings.AUTH_BYPASS_ENABLED:
        user_id = UUID(settings.AUTH_BYPASS_USER_ID)
        user = session.get(User, user_id)
        if user is None:
            user = User(
                id=user_id,
                first_name="Local",
                last_name="Author",
                username="local_author",
                email="local-author@gestalt.invalid",
            )
        author_role = await RoleDB(session).get_role(UserRoles.DEVELOPER)
        if author_role is None:
            raise ValueError("Developer role was not seeded for auth bypass")
        if author_role not in user.roles:
            user.roles.append(author_role)
        session.add(user)
        session.commit()
        profile = session.exec(
            select(DeveloperProfile).where(DeveloperProfile.user_id == user_id)
        ).first()
        if profile is None:
            session.add(
                DeveloperProfile(
                    user_id=user_id,
                    storage_path=f"local_authors/{user_id}/",
                )
            )
            session.commit()
        logger.warning("[Initialization] Local authentication bypass is enabled")


## Intializes the database
@asynccontextmanager
async def on_startup(_app: FastAPI) -> AsyncIterator[None]:
    try:
        # Attempt to initialize firebase application
        initialize_firebase_app()
        # Ensures that the roles are present at startup
        with Session(engine) as session:
            await seed_database(session)
            await QuestionInstanceDB(session).cleanup_expired()
        yield
    except Exception as e:
        raise ValueError(f"Failed to initialize app {e}") from e


def add_routes(app: FastAPI, routes: list[APIRouter] = ALL_ROUTES) -> None:
    for r in routes:
        app.include_router(r)


def get_application(_test_mode: bool = False) -> FastAPI:
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


def main() -> None:
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )


if __name__ == "__main__":
    main()
