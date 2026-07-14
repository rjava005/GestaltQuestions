from enum import StrEnum
from uuid import UUID


class Runtime(StrEnum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"


ID = str | UUID | None
