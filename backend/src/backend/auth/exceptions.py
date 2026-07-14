"""Auth domain exceptions for users, roles, institutions, and developer access."""


class AuthError(Exception):
    """Base exception for auth-domain failures."""

    default_message = "Auth operation failed"

    def __init__(
        self,
        message: str | None = None,
        *,
        operation: str | None = None,
        details: str | None = None,
    ) -> None:
        self.operation = operation
        self.details = details

        final_message = message or self.default_message
        if operation:
            final_message = f"{final_message} during {operation}"
        if details:
            final_message = f"{final_message}: {details}"

        super().__init__(final_message)


class AuthValidationError(AuthError, ValueError):
    """Raised when auth input data is invalid."""

    default_message = "Invalid auth data"


class AuthDatabaseError(AuthError):
    """Raised when auth persistence operations fail."""

    default_message = "Auth database operation failed"


class AuthExternalServiceError(AuthError):
    """Raised when an external auth dependency fails."""

    default_message = "External auth service operation failed"


class UserError(AuthError):
    """Base exception for user failures."""

    default_message = "User operation failed"


class UserValidationError(AuthValidationError):
    """Raised when user input data fails validation."""

    default_message = "Invalid user data"


class UserNotFound(UserError, LookupError):
    """Raised when a user cannot be found."""

    def __init__(self, user_id: str | None = None, message: str | None = None) -> None:
        if message is None:
            message = f"User '{user_id}' not found" if user_id else "User not found"
        super().__init__(message)


class UserCreateError(UserError):
    """Raised when a user cannot be created."""

    default_message = "Failed to create user"


class UserReadError(UserError):
    """Raised when user data cannot be retrieved."""

    default_message = "Failed to retrieve user"


class UserUpdateError(UserError):
    """Raised when a user cannot be updated."""

    default_message = "Failed to update user"


class UserDeleteError(UserError):
    """Raised when a user cannot be deleted."""

    default_message = "Failed to delete user"


class FirebaseUserError(AuthExternalServiceError):
    """Raised when Firebase user operations fail."""

    default_message = "Firebase user operation failed"


class RoleError(AuthError):
    """Base exception for role failures."""

    default_message = "Role operation failed"


class RoleNotFound(RoleError, LookupError):
    """Raised when a role cannot be found."""

    def __init__(self, role: str | None = None, message: str | None = None) -> None:
        if message is None:
            message = f"Role '{role}' not found" if role else "Role not found"
        super().__init__(message)


class RoleCreateError(RoleError):
    """Raised when a role cannot be created."""

    default_message = "Failed to create role"


class RoleReadError(RoleError):
    """Raised when role data cannot be retrieved."""

    default_message = "Failed to retrieve role"


class RoleAssignmentError(RoleError):
    """Raised when a role cannot be assigned to a user."""

    default_message = "Failed to assign role to user"


class RoleSeedError(RoleError):
    """Raised when default roles cannot be seeded."""

    default_message = "Failed to seed roles"


class InstitutionError(AuthError):
    """Base exception for institution failures."""

    default_message = "Institution operation failed"


class InstitutionValidationError(AuthValidationError):
    """Raised when institution input data is invalid."""

    default_message = "Invalid institution data"


class InstitutionNotFound(InstitutionError, LookupError):
    """Raised when an institution cannot be found."""

    def __init__(
        self,
        institution: str | None = None,
        message: str | None = None,
    ) -> None:
        if message is None:
            message = (
                f"Institution '{institution}' not found"
                if institution
                else "Institution not found"
            )
        super().__init__(message)


class InstitutionCreateError(InstitutionError):
    """Raised when an institution cannot be created."""

    default_message = "Failed to create institution"


class InstitutionReadError(InstitutionError):
    """Raised when institution data cannot be retrieved."""

    default_message = "Failed to retrieve institution"


class InstitutionAssignmentError(InstitutionError):
    """Raised when an institution cannot be assigned to a user."""

    default_message = "Failed to assign institution to user"


class InstitutionSeedError(InstitutionError):
    """Raised when default institutions cannot be seeded."""

    default_message = "Failed to seed institutions"


class DeveloperAccessDenied(AuthError, PermissionError):
    """Raised when a user is not allowed to perform a developer action."""

    def __init__(
        self,
        reason: str,
        user_id: str | None = None,
        question_id: str | None = None,
    ) -> None:
        message = "Developer access denied"
        if user_id:
            message += f" for user {user_id}"
        if question_id:
            message += f" on question {question_id}"
        if reason:
            message += f": {reason}"
        super().__init__(message)


class DeveloperProfileError(AuthError):
    """Raised when developer profile data cannot be retrieved or prepared."""

    default_message = "Developer profile operation failed"

    def __init__(self, action: str, user_id: str, details: str = "") -> None:
        message = f"Failed to {action} developer profile for user {user_id}"
        if details:
            message += f": {details}"
        super().__init__(message)


class DeveloperProfileNotSet(DeveloperProfileError, LookupError):
    """Raised when a developer profile is required but has not been configured."""

    def __init__(self, action: str, user_id: str, details: str = "") -> None:
        super().__init__(action, user_id, details or "Developer profile is not set")


class DeveloperStoragePathError(DeveloperProfileError):
    """Raised when a developer storage path cannot be generated or prepared."""
