from .questions.init import routes as questions_routes
from .startup import router as general_router
from .run_question_server import router as question_runner
from .generic import routes as generic_routes
from .user import router as user_route
from .sandbox import router as sandbox_router

routes = [
    general_router,
    question_runner,
    user_route,
    sandbox_router,
]

routes.extend(questions_routes)
routes.extend(generic_routes)
