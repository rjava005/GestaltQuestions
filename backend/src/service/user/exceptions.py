class DeveloperAccessDenied(PermissionError):
    """Raised when a user is not allowed to perform a developer question action."""

    def __init__(
        self,
        reason: str,
        user_id: str | None = None,
        question_id: str | None = None,
    ):
        message = "Developer access denied"
        if user_id:
            message += f" for user {user_id}"
        if question_id:
            message += f" on question {question_id}"
        if reason:
            message += f": {reason}"
        super().__init__(message)


class DeveloperProfileError(DeveloperAccessDenied):
    """Raised when developer profile data cannot be retrieved or prepared."""

    def __init__(self, action: str, user_id: str, details: str = ""):
        message = f"Failed to {action} developer profile for user {user_id}"
        if details:
            message += f": {details}"
        super().__init__(message)


class DeveloperProfileNotSet(DeveloperAccessDenied):
    def __init__(self, action: str, user_id: str, details: str = ""):
        message = f"Failed to {action} developer profile for user {user_id}"
        if details:
            message += f": {details}"
        super().__init__(message)
