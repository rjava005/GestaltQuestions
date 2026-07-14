from backend.api.general import routes as general_routes
from backend.api.langchain.langchain import router as agent_router
from backend.api.question_manager import router as developer_question_router
from backend.api.question_tables import router as question_tables_router
from backend.api.questions import qcrud_router
from backend.api.run_question import RUNTIME_ROUTES
from backend.api.threads import router as chat_router
from backend.api.user import developer_router, health_router, user_router

ALL_ROUTES = [
    user_router,
    health_router,
    developer_router,
    developer_question_router,
    question_tables_router,
    agent_router,
    qcrud_router,
    chat_router,
    *general_routes,
    *RUNTIME_ROUTES,
]

__all__ = ["ALL_ROUTES"]
