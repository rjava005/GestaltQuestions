from .startup import router as startup_router

health_routes = [startup_router]

__all__ = ["health_routes"]
