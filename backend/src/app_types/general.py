from uuid import UUID
from typing import Literal

ID = str | UUID | None
AllowedLanguages = Literal["javascript", "python"]

STORAGE_TYPE = Literal["cloud", "local"]