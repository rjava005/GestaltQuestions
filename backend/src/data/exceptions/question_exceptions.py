class QuestionDBError(Exception):
    """Base exception for question persistence errors."""


class QuestionValidationError(QuestionDBError):
    """Raised when question input data is invalid."""


class QuestionNotFoundError(QuestionDBError):
    """Raised when a question cannot be found."""


class QuestionStorageTypeError(QuestionDBError):
    """Raised when an invalid storage type is provided."""


class QuestionCreateError(QuestionDBError):
    """Raised when a question cannot be created."""


class QuestionReadError(QuestionDBError):
    """Raised when question data cannot be retrieved."""


class QuestionUpdateError(QuestionDBError):
    """Raised when a question cannot be updated."""


class QuestionDeleteError(QuestionDBError):
    """Raised when a question cannot be deleted."""


class QuestionPathError(QuestionDBError):
    """Raised when a question path cannot be read or updated."""
