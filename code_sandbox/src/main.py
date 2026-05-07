import os
from fastapi import FastAPI
import uvicorn
from src.web.code_running import router
from fastapi.middleware.cors import CORSMiddleware

from src.core.settings import get_settings

settings = get_settings()


def get_app():
    app = FastAPI()
    app.include_router(router)
    return app


app = get_app()

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


def main():
    uvicorn.run(
        "src.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8080)),
        reload=True,
    )


if __name__ == "__main__":
    main()
