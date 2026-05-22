from src.app_types.general import STORAGE_TYPE
from .firebase_storage import FbStorage
from .local_storage import LocalStorage
from .base import Storage

__all__ = ["STORAGE_TYPE", "Storage", "FbStorage", "LocalStorage"]
