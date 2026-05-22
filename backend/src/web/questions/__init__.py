from .crud import router as qcrud_router

# from .files import router as qfile_router
# from .sync import router as sync_router
# from .download import router as download_router
# from src.service.storage import STORAGE_TYPE
# from .uploads import router as upload_router

# routes = [qcrud_router, qfile_router, sync_router, download_router, upload_router]
__all__ = ["qcrud_router"]