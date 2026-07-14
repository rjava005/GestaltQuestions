"""Custom exceptions for QuestionManager service."""


class QuestionManagerException(Exception):
    """Base exception for all QuestionManager errors."""

    pass


# ============================================================
# Developer Question Service Exceptions
# ============================================================


class DeveloperQuestionServiceError(QuestionManagerException):
    """Base exception for developer question service errors."""


class DeveloperQuestionControlError(DeveloperQuestionServiceError):
    """Raised when developer question ownership/control cannot be evaluated."""

    def __init__(self, user_id: str, question_id: str, details: str = "") -> None:
        message = (
            f"Failed to evaluate question control for user {user_id} "
            f"on question {question_id}"
        )
        if details:
            message += f": {details}"
        super().__init__(message)


# ============================================================
# Storage & Path Exceptions
# ============================================================


class StoragePathNotFoundError(QuestionManagerException):
    """Raised when a question storage path is not provided or invalid."""

    def __init__(self, question_id: str | None = None) -> None:
        if question_id:
            message = f"Storage path not found for question: {question_id}"
        else:
            message = "No storage path provided for question"
        super().__init__(message)


class StorageOperationError(QuestionManagerException):
    """Raised when a storage operation fails (read, write, delete, etc.)."""

    def __init__(self, operation: str, path: str, details: str = "") -> None:
        message = f"Storage operation failed [{operation}]: {path}"
        if details:
            message += f" - {details}"
        super().__init__(message)


class StorageDirectoryNotFoundError(QuestionManagerException):
    """Raised when a question's storage directory doesn't exist."""

    def __init__(self, question_id: str, path: str) -> None:
        message = f"Storage directory does not exist for question {question_id}: {path}"
        super().__init__(message)


# ============================================================
# Question Lifecycle Exceptions
# ============================================================


class QuestionNotFoundError(QuestionManagerException):
    """Raised when a question cannot be retrieved from the database."""

    def __init__(self, question_id: str) -> None:
        message = f"Question not found: {question_id}"
        super().__init__(message)


class QuestionCreationError(QuestionManagerException):
    """Raised when question creation fails."""

    def __init__(self, reason: str, details: str = "") -> None:
        message = f"Failed to create question: {reason}"
        if details:
            message += f" - {details}"
        super().__init__(message)


class QuestionUpdateError(QuestionManagerException):
    """Raised when question update fails."""

    def __init__(self, question_id: str, reason: str, details: str = "") -> None:
        message = f"Failed to update question {question_id}: {reason}"
        if details:
            message += f" - {details}"
        super().__init__(message)


class QuestionCopyFailure(QuestionManagerException):
    def __init__(self, reason: str, details: str = "") -> None:
        message = f"Failed to update question : {reason}"
        if details:
            message += f" - {details}"
        super().__init__(message)


class QuestionDeletionError(QuestionManagerException):
    """Raised when question deletion fails."""

    def __init__(self, question_id: str, reason: str = "", details: str = "") -> None:
        message = f"Failed to delete question {question_id}"
        if reason:
            message += f": {reason}"
        if details:
            message += f" - {details}"
        super().__init__(message)


# ============================================================
# File Operation Exceptions
# ============================================================


class FileOperationError(QuestionManagerException):
    """Raised when a file operation fails."""

    def __init__(self, operation: str, filename: str, reason: str = "") -> None:
        message = f"File operation failed [{operation}]: {filename}"
        if reason:
            message += f" - {reason}"
        super().__init__(message)


class InvalidFileError(QuestionManagerException):
    """Raised when a file is invalid or cannot be processed."""

    def __init__(self, filename: str, reason: str) -> None:
        message = f"Invalid file '{filename}': {reason}"
        super().__init__(message)


class FileSaveError(QuestionManagerException):
    """Raised when saving a file to question storage fails."""

    def __init__(self, filename: str, question_id: str, reason: str = "") -> None:
        message = f"Failed to save file '{filename}' to question {question_id}"
        if reason:
            message += f": {reason}"
        super().__init__(message)


class FileListError(QuestionManagerException):
    """Raised when listing files in a question fails."""

    def __init__(self, question_id: str, reason: str = "") -> None:
        message = f"Failed to list files for question {question_id}"
        if reason:
            message += f": {reason}"
        super().__init__(message)


# ============================================================
# Data Validation Exceptions
# ============================================================


class InvalidQuestionDataError(QuestionManagerException):
    """Raised when question data is invalid."""

    def __init__(self, field: str, reason: str) -> None:
        message = f"Invalid question data field '{field}': {reason}"
        super().__init__(message)


class MissingQuestionDataError(QuestionManagerException):
    """Raised when required question data is missing."""

    def __init__(self, field: str) -> None:
        message = f"Missing required question field: {field}"
        super().__init__(message)


# ============================================================
# Path & Naming Exceptions
# ============================================================


class PathNormalizationError(QuestionManagerException):
    """Raised when path normalization fails."""

    def __init__(self, path, reason: str = "") -> None:
        message = f"Failed to normalize path: {path}"
        if reason:
            message += f" - {reason}"
        super().__init__(message)


class InvalidPathError(QuestionManagerException):
    """Raised when a path is invalid or unsupported."""

    def __init__(self, path, path_type: str = "") -> None:
        message = f"Invalid path: {path}"
        if path_type:
            message += f" (type: {path_type})"
        super().__init__(message)
