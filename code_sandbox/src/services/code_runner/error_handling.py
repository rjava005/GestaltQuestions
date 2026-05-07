class ExecutionError(Exception):
    """Raised when the sandbox fails to execute user code safely."""

    def __init__(self, message, original_exception=None):
        super().__init__(message)
        self.original_exception = original_exception
