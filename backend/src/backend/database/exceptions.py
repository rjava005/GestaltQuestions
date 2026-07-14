from backend.core.exceptions import GestaltCoreError


# Database exceptions
class DatabaseConfigError(GestaltCoreError):
    """Raised when database configuration is invalid for the current environment."""


class DatabaseInitializationError(GestaltCoreError):
    """Raised when creating the database engine/session setup fails."""


class DatabaseSessionError(GestaltCoreError):
    """Raised for unexpected database session lifecycle failures."""
