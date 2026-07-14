from .files import router as file_router
from .startup import router as startup_router

routes = [startup_router, file_router]
