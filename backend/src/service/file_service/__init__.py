from fastapi import UploadFile

from src.model.files import FileData

# ======================================
# File Upload Configuration
# ======================================


# Maximum file size (in megabytes)
MAX_FILE_SIZE_MB = 5

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    # Images
    ".png",
    ".jpg",
    ".jpeg",
    # Documents
    ".pdf",
    ".txt",
    ".html",
    ".json",
    # Code Files
    ".py",
    ".js",
    ".bin",
}

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "application/pdf",
    "text/plain",
    "text/html",
    "application/json",
    "text/x-python",
    "application/javascript",
    "application/octet-stream",
    "text/javascript",
}

# Allowed ZIP file MIME types
ALLOWED_ZIP_EXTENSIONS = {
    "application/zip",
    "application/x-zip-compressed",
}

# Allowed image MIME types
ALLOWED_IMAGE_EXTENSIONS = {
    "image/png",
    "image/jpeg",
    "image/jpg",
}
