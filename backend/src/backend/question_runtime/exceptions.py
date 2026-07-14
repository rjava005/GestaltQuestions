from fastapi import HTTPException
from starlette import status


class RuntimePrepareError(Exception):
    """Base exception for all runtime preparation errors."""

    pass


class InvalidFilePayloadError(RuntimePrepareError):
    """Raised when file payload is invalid (empty, bad names,  etc.)."""

    pass


class InvalidEntryError(RuntimePrepareError):
    """Raised when cannot resolve entry file for execution. Either missing, or file is empty in the file"""


class ConfigurationError(RuntimePrepareError):
    """Raised when config.json is malformed, unparseable, or violates the schema."""

    pass


class RuntimeResolutionError(RuntimePrepareError):
    """Raised when the target language cannot be resolved."""

    pass


class MissingQuestionFileError(Exception):
    pass


class QuestionRuntimeDBError(Exception):
    """Base exception for question runtime persistence errors."""


class QuestionRuntimeReadError(QuestionRuntimeDBError):
    """Raised when question runtime data cannot be retrieved."""


class QuestionRuntimeCreateError(QuestionRuntimeDBError):
    """Raised when question runtime data cannot be created."""


class QuestionRuntimeUpdateError(QuestionRuntimeDBError):
    """Raised when question runtime data cannot be updated."""


class QuestionRuntimeUpsertError(QuestionRuntimeDBError):
    """Raised when question runtime data cannot be created or updated."""


class QuestionRuntimeServiceError(HTTPException):
    """Base exception for question runtime service errors."""


class RuntimeExecutionError(QuestionRuntimeServiceError):
    """Raised when sandbox runtime execution fails."""

    def __init__(
        self,
        question_id: str,
        detail: object,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    ) -> None:
        super().__init__(
            status_code=status_code,
            detail={
                "status_code": status_code,
                "message": f"Runtime execution failed for question {question_id}.",
                "execution_error": detail,
            },
        )


class MissingRuntimeOutputError(QuestionRuntimeServiceError):
    """Raised when runtime execution returns no output."""

    def __init__(self, question_id: str) -> None:
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Runtime execution returned no output for question {question_id}.",
        )
