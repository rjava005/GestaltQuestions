from src.app_types.general import STORAGE_TYPE

from .base import Storage
from .firebase_storage import FbStorage
from .local_storage import LocalStorage

__all__ = ["STORAGE_TYPE", "FbStorage", "LocalStorage", "Storage"]
