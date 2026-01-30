from src.web.questions import routes as question_routes
from src.web.sandbox import router as sandbox_router
from src.web.run_question import router as runq_router
from src.web.user import router as user_router
from src.web.startup import router as startup_router





ALL_ROUTES = [sandbox_router, runq_router, user_router, startup_router]

ALL_ROUTES.extend(
    question_routes,
)
