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
