class FileConverterError(Exception):
    """Base exception for file conversion errors."""


class InvalidUploadFileError(FileConverterError):
    """Raised when an upload object is missing required metadata."""


class FileTooLargeError(FileConverterError):
    """Raised when uploaded file exceeds configured max size."""


class FileReadError(FileConverterError):
    """Raised when uploaded file content cannot be read."""


class FileContentDecodeError(FileConverterError):
    """Raised when text file content cannot be decoded as UTF-8."""


class UnsupportedFileInputError(FileConverterError):
    """Raised when input type cannot be converted to FileData."""
